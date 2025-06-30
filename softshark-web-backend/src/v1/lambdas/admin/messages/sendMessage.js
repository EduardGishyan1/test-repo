import 'regenerator-runtime/runtime';
import logger from "../../../../utils/logger.js";
import {response} from "../../../../utils/helpers.js";

import { SESClient,SendEmailCommand } from "@aws-sdk/client-ses";
const ses = new SESClient({})

const {
    SOFTSHARK_WEB_SEND_EMAIL_TO
} = process.env;

exports.handler = async (event) => {
    try {
        let bodyParsed
        try {
            bodyParsed = JSON.parse(event.body)
            console.log(bodyParsed, "body")
        } catch(e) {
            console.log(bodyParsed, "body error")

            return response(400, {
                error: 'Could not parse body',
            });
        }

        const { email } = bodyParsed;
        console.log(email, "email")

        if (!email) {
            return response(400, {
                error: 'E-mail is required in the body',
            });
        }

        const params = {
            Destination: {
                ToAddresses: [email]
            },
            Message: {
                Body: {
                    Html: {Data: 'We want to check meeting time with you'}
                },
                Subject: {Data: 'Response email from Softshark'}
            },
            Source: SOFTSHARK_WEB_SEND_EMAIL_TO
        }
        console.log(params, "params")

        try {
            const commandSendEmail = new SendEmailCommand(params);
            await ses.send(commandSendEmail);
            console.log("success");

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
