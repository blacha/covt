import { SourceFile } from '@cogeotiff/source-file';
import { Covt } from '@covt/core';
import fastify from 'fastify';
import { promises as fs } from 'fs';
import pino from 'pino';
import { PrettyTransform } from 'pretty-json-log';
import fastifyCors from 'fastify-cors';

const logger = process.stdout.isTTY ? pino(PrettyTransform.stream()) : pino();

async function createServer(fileName: string, port: number): Promise<void> {
  const url = 'http://localhost:' + port;
  const source = new SourceFile(fileName);
  logger.debug({ indexPath: fileName + '.index' }, 'Index:Load');
  const sourceIndex = await fs.readFile(fileName + '.index');
  const index = JSON.parse(sourceIndex.toString());

  const covt = await Covt.create(source, index);

  const server = fastify({ logger });
  server.register(fastifyCors);

  server.get<{ Params: { '*': string } }>(
    '/file/*',
    async (req, res): Promise<unknown> => {
      const path = req.params['*'];
      logger.info({ path: `${url}/file/${path}` }, 'GetFile');
      console.log({ params: req.params });
      const file = await covt.getFile(path);
      if (file == null) {
        res.status(404).send();
        return;
      }

      res.header('content-encoding', 'gzip');
      res.header('content-type', 'application/x-protobuf');
      res.send(Buffer.from(file.buffer));

      logger.info({ path, bytes: file.buffer.byteLength, contentType: file.contentType }, 'GetFile');
      return;
    },
  );

  server.get('/tile.json', (req, res) => {
    res.send({
      tiles: [`${url}/file/tiles/{z}/{x}/{y}.pbf?api=` + Math.random().toString(32).slice(2)],
      minzoom: 0,
      maxzoom: 15,
      format: 'pbf',
      tilejson: '2.0.0',
    });
  });

  await server.listen(port, '0.0.0.0');
  logger.info({ url }, 'ServerStarted');
}

createServer('../cli/2021-04-04-raw.covt', 8080);
