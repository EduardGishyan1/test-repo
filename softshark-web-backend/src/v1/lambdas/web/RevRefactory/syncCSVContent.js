import 'regenerator-runtime/runtime';
import XLSX from 'xlsx';
import { S3 } from '@aws-sdk/client-s3';
import logger from '../../../../utils/logger';
import { createItem } from '../../../modules/dynamoDB';

// eslint-disable-next-line import/prefer-default-export
export const handler = async () => {
  const getParams = {
    Bucket: 'softshark-public-assets',
    Key: 'DEVREFACTORY-stores.xlsx',
  };
  let data = await S3.getObject(getParams);
  logger.info(data);
  const wb = XLSX.read(data.Body, { type: 'buffer' });
  let ws;
  logger.info(wb);
  const target_sheet = 'Working Store List Under Audit';
  try {
    ws = wb.Sheets[target_sheet];
    logger.log(JSON.parse(JSON.stringify(ws)));
    logger.info(wb.SheetNames);
    if (!ws) {
      console.error(`Sheet ${target_sheet} cannot be found`);
    }
  } catch (e) {
    logger.error(e);
  }
  data = XLSX.utils.sheet_to_json(JSON.parse(JSON.stringify(ws)));
  console.log(data);
  const promiseeArr = [];
  const params = {
    TableName: 'eligabable-stores-devrefactory-dev',
  };
  for (let i = 0; i < data.length; i += 1) {
    const item = data[i];
    item.id = `${item.FP_STORE}`;
    params.Item = item;
    promiseeArr.push(createItem(params));
  }
  await Promise.all(promiseeArr);
  logger.info('done');
};
