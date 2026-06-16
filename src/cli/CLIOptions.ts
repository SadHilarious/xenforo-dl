import { DownloaderOptions } from '../lib/DownloaderOptions.js';
import { pickDefined } from '../lib/utils/Misc.js';
import { LogLevel } from '../lib/utils/logging/Logger.js';
import CLIOptionValidator from './CLIOptionValidator.js';
import CommandLineParser from './CommandLineParser.js';
import fs from 'fs';

export interface CLIOptions extends Omit<DownloaderOptions, 'dirStructure' | 'logger'> {
  url: string;
  noPrompt: boolean;
  dirStructure: string;
  logging: {
    level: LogLevel;
    file?: string;
  };
  continue: boolean;
}

export interface CLIOptionParserEntry {
  key: string;
  value?: string;
}

export function getCLIOptions(): CLIOptions {
  const commandLineOptions = CommandLineParser.parse();

  const dirStructure = CLIOptionValidator.validateFlags(commandLineOptions.dirStructure, 's', 'pl', 'pi', 't', 'a', '-');

  let cookie: string | null = CLIOptionValidator.validateString(commandLineOptions?.request?.cookie) || null;
  if (cookie) {
    if (fs.existsSync(cookie)) {
      try {
        cookie = fs.readFileSync(cookie, 'utf-8').trim();
      } catch (err) {
        // Keep original if read fails
      }
    }
  } else {
    if (process.env.XENFORO_COOKIE) {
      cookie = process.env.XENFORO_COOKIE.trim();
    } else if (process.env.COOKIE) {
      cookie = process.env.COOKIE.trim();
    } else if (fs.existsSync('./cookie.txt')) {
      try {
        cookie = fs.readFileSync('./cookie.txt', 'utf-8').trim();
      } catch (err) {
        // Ignore
      }
    }
  }

  const options: CLIOptions = {
    url: CLIOptionValidator.validateRequired(commandLineOptions.url, 'No target URL specified'),
    outDir: CLIOptionValidator.validateString(commandLineOptions.outDir),
    dirStructure: pickDefined(dirStructure, 'splta'),
    overwrite: CLIOptionValidator.validateBoolean(commandLineOptions.overwrite),
    request: {
      maxRetries: CLIOptionValidator.validateNumber(commandLineOptions?.request?.maxRetries),
      maxConcurrent: CLIOptionValidator.validateNumber(commandLineOptions?.request?.maxConcurrent),
      minTime: {
        page: CLIOptionValidator.validateNumber(commandLineOptions?.request?.minTime?.page),
        attachment: CLIOptionValidator.validateNumber(commandLineOptions?.request?.minTime?.attachment)
      },
      cookie
    },
    noPrompt: CLIOptionValidator.validateBoolean(commandLineOptions.noPrompt) || false,
    logging: {
      level: CLIOptionValidator.validateString(commandLineOptions.logging?.level, 'info', 'debug', 'warn', 'error', 'none') || 'info',
      file: CLIOptionValidator.validateString(commandLineOptions.logging?.file)
    },
    continue: CLIOptionValidator.validateBoolean(commandLineOptions.continue) || false
  };

  return options;
}
