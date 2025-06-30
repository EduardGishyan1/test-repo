import 'regenerator-runtime/runtime';
import { v4 as uuidv4 } from 'uuid';
// validation
import { extractExistingProperties, response } from '../../../utils/helpers';
import { createItem } from '../../modules/dynamoDB';
import logger from '../../../utils/logger';
import { APPLY_JOB_TYPE_NAME } from '../../../utils/constants/posts';

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {unmarshall} from "@aws-sdk/util-dynamodb";
const s3 = new S3Client({});

// env
const { APPLY_JOB_TABLE_NAME } = process.env;

export const handler = async (event) => {
    try {
        let body;

        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return response(400, {
                error: 'Provide a valid JSON body',
            });
        }

        const {base64File, filename} = body;
        if(filename) {
            const fileBuffer = Buffer.from(base64File, 'base64');

            const command = new PutObjectCommand({
                    Body: fileBuffer,
                    Bucket: 'softshark-web',
                    Key: filename,
                    ContentDisposition: `attachment; filename="${filename}"`
                });
            await s3.send(command);
        }

        const jobApplicationDetails = extractExistingProperties(
            body,
            ['email', 'jobPosition', 'applicantName', 'fileURL'],
        );

        const createdAt = new Date().toISOString();

        logger.debug({ jobApplicationDetails }, 'Details of job application');

        const params = {
            TableName: APPLY_JOB_TABLE_NAME,
            Item: {
                email:{S: jobApplicationDetails['email']},
                jobPosition: {S: jobApplicationDetails['jobPosition']},
                applicantName: {S: jobApplicationDetails['applicantName']},
                fileURL: {S: jobApplicationDetails['fileURL']},
                id: {S: createdAt + uuidv4()},
                type: {S: APPLY_JOB_TYPE_NAME},
                createdAt : {S: createdAt},
            },
        };
        const { Item: Attributes } = params;

        const jobApplication = await createItem(params);

        logger.debug({ jobApplication }, 'Successfully created');

        return response(200, {
            data: unmarshall(Attributes),
        });
    } catch (e) {
        logger.error(e.message);
        return response(500, {
            error: e.message,
        });
    }
};
