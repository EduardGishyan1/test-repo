import 'regenerator-runtime/runtime';
import logger from "../../../utils/logger.js";
import {response} from "../../../utils/helpers.js";

// const ses = new aws.SES();
import { SESClient,SendEmailCommand } from "@aws-sdk/client-ses";
const ses = new SESClient({})

const {
    SOFTSHARK_WEB_SEND_EMAIL_TO,
    SOFTSHARK_WEB_SEND_EMAIL_FROM
} = process.env;

export const handler = async (event) => {
    try {
        let bodyParsed
        try {
            bodyParsed = JSON.parse(event.body)
        } catch(e) {
            return response(400, {
                error: 'Could not parse body',
            });
        }

        const { subject, text } = bodyParsed;

        if (!subject || !text) {
            return response(400, {
                error: 'subject, text are required in the body',
            });
        }

        const params = {
            Destination: {
                ToAddresses: [SOFTSHARK_WEB_SEND_EMAIL_TO]
            },
            Message: {
                Body: {
                    Html: {Data: text}
                },
                Subject: {Data: subject}
            },
            Source: SOFTSHARK_WEB_SEND_EMAIL_FROM
        }

        try {
            const commandSendEmail = new SendEmailCommand(params);
            await ses.send(commandSendEmail);
            return response(200, {
                data: {},
            });
        } catch (error) {
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
};
