import 'regenerator-runtime/runtime';

import mimemessage from "mimemessage";
import { response } from '../../../utils/helpers.js';
import logger from "../../../utils/logger.js";
import { S3Client,GetObjectCommand}  from "@aws-sdk/client-s3";
import { SESClient,SendRawEmailCommand,SendEmailCommand } from "@aws-sdk/client-ses";

const s3 =  new S3Client({});
const ses = new SESClient({})

const {
    SOFTSHARK_WEB_SEND_EMAIL_TO,
    SOFTSHARK_WEB_SEND_EMAIL_FROM
} = process.env;

export const handler = async event => {
    try {
        let bodyParsed;
        try {
            bodyParsed = JSON.parse(event.body)
        } catch (e) {
            return response(400, {error: "Could not parse body"})
        }

        const {jobPosition, text, base64File, filename, applicantName, email} = bodyParsed;

        if (!jobPosition || !text) {
            return response(400, {error: "jobPosition, text are required in the body"})
        }

        const mailContent = mimemessage.factory({contentType: 'multipart/mixed', body: []});

        mailContent.header('From', `${applicantName} <${SOFTSHARK_WEB_SEND_EMAIL_FROM}>`);
        mailContent.header('To', SOFTSHARK_WEB_SEND_EMAIL_TO);
        mailContent.header('Subject', jobPosition);
        console.log("updated" + mailContent)
        const alternateEntity = mimemessage.factory({
            contentType: 'multipart/alternate',
            body: []
        });

        const htmlEntity = mimemessage.factory({
            contentType: 'text/html;charset=utf-8',
            body: text
        });

        alternateEntity.body.push(htmlEntity);
        mailContent.body.push(alternateEntity);

        if (filename) {
            const attachmentEntity = mimemessage.factory({
                contentType: 'text/plain',
                body: base64File
            });

            attachmentEntity.header('Content-Disposition', `attachment ;filename="${filename}"`);
            attachmentEntity.header('Content-Transfer-Encoding', `base64`);

            mailContent.body.push(attachmentEntity);
        }

        const params = {Bucket: 'softshark-public-assets', Key: 'responseEmail.html'};

        const command = new GetObjectCommand(params);
        const data = await s3.send(command);

        const templateWithPositionAndApplicantName = await data.Body.transformToString()

        const replacedString = templateWithPositionAndApplicantName.replace("##Applicant##", applicantName)
            .replace("##Position##", jobPosition);

        const applierParams = {
            Destination: {
                ToAddresses: [email]
            },
            Message: {
                Body: {
                    Html: {Data: replacedString}
                },
                Subject: {Data: 'Thank you for applying'}
            },
            Source: `Softshark <${SOFTSHARK_WEB_SEND_EMAIL_TO}>`
        }

        console.log(applierParams)
        logger.info({applierParams});

        try {
            const commandSendRaw = new SendRawEmailCommand({
                RawMessage: {Data: Buffer.from(mailContent.toString())}
            });
            const sendRawResult = await ses.send(commandSendRaw);
            logger.info({ sendRawResult }, 'Sent raw email');

            const commandSendEmail = new SendEmailCommand(applierParams);
            const sendResult = await ses.send(commandSendEmail);
            logger.info({ sendResult }, 'Sent email');
            return response(200, {
                data: {},
            });
        } catch (error) {
            logger.error(error);
            return response(400, {
                error: 'Fail sending email!',
            });
        }
    } catch (e) {
        logger.error(e.message);
        return response(500, {
            error: e.message,
        });
    }
}
