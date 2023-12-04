import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm"

import axios, { AxiosRequestConfig } from "axios"

const endpoint = "https://discord.com/api/v10"
const token_id = process.env.BOT_TOKEN_SECRET_ID
const client = new SecretsManagerClient();
const created_thread_parameter = process.env.THREAD_CHANNEL_PARAMETER
const ssmClient = new SSMClient()

const token = client.send(new GetSecretValueCommand({
    SecretId: token_id
}))

export const main = async () => {

    const config: AxiosRequestConfig = {
        headers: {
            "Authorization": `Bot ${(await token).SecretString}`
        }
    }

    const created_thread = await ssmClient.send(new GetParameterCommand({
        Name: created_thread_parameter
    }))

    const message = await axios.patch(`${endpoint}/channels/${created_thread.Parameter?.Value}`,
        {
            locked: true
        }
        , config)
}