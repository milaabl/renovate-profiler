import { logger } from '../logger';
import * as options from './options';
import type { RenovateConfig } from './types';

export function mergeChildConfig<
  T extends Record<string, any>,
  TChild extends Record<string, any> | undefined
>(parent: T, child: TChild): T & TChild {
  // @ts-ignore
  if (!global.mergeChildConfigCalls) {
    // @ts-ignore
    global.mergeChildConfigCalls = 0;
  }
  // @ts-ignore
  global.mergeChildConfigCalls = global.mergeChildConfigCalls + 1;

  const startTime = Date.now();

  // @ts-ignore
  if (!global.mergeChildConfigCallsTotalExecutionTime) {
    // @ts-ignore
    global.mergeChildConfigCallsTotalExecutionTime = 0;
  }


  logger.trace({ parent, child }, `mergeChildConfig`);
  if (!child) {
    return parent as never;
  }
  const parentConfig = structuredClone(parent);
  const childConfig = structuredClone(child);
  const config: Record<string, any> = { ...parentConfig, ...childConfig };
  for (const option of options.getOptions()) {
    if (
      option.mergeable &&
      childConfig[option.name] &&
      parentConfig[option.name]
    ) {
      logger.trace(`mergeable option: ${option.name}`);
      if (option.name === 'constraints') {
        config[option.name] = {
          ...parentConfig[option.name],
          ...childConfig[option.name],
        };
      } else if (option.type === 'array') {
        config[option.name] = (parentConfig[option.name] as unknown[]).concat(
          config[option.name]
        );
      } else {
        config[option.name] = mergeChildConfig(
          parentConfig[option.name] as RenovateConfig,
          childConfig[option.name] as RenovateConfig
        );
      }
      logger.trace(
        { result: config[option.name] },
        `Merged config.${option.name}`
      );
    }
  }
  // @ts-ignore
  global.mergeChildConfigCallsTotalExecutionTime += Date.now() - startTime;
  return { ...config, ...config.force };
}
