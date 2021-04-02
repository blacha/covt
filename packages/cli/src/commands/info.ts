import { Covt } from '@covt/core';
import Command, { flags } from '@oclif/command';
import { logger } from '../log';

import { SourceFile } from '@cogeotiff/source-file';

export class CreateCovt extends Command {
  static flags = { verbose: flags.boolean({ description: 'verbose logging' }) };

  static args = [{ name: 'inputFile', required: true }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(CreateCovt);
    if (flags.verbose) logger.level = 'debug';

    logger.info({ fileName: args.inputFile }, 'Info');

    const source = new SourceFile(args.inputFile);
    const sourceIndex = new SourceFile(args.inputFile + '.index');

    const covt = await Covt.create(source, sourceIndex);
  }
}
