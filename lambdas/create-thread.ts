import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager"
import { PutParameterCommand, SSMClient } from "@aws-sdk/client-ssm"
import axios, { AxiosRequestConfig } from "axios"
import { add, format } from "date-fns";

const endpoint = "https://discord.com/api/v10"
const channel = process.env.CHANNEL
const token_id = process.env.BOT_TOKEN_SECRET_ID
const created_thread_parameter = process.env.THREAD_CHANNEL_PARAMETER
const client = new SecretsManagerClient();
const ssmClient = new SSMClient()

const initialMessage = `
We've made a guide here for how this will work, and most of this is the normal rules we've had for the showcases over the last few years with a few new rules to help keep it concise and fair to all:

1) This Thread will remain open for people to post their work until 6:30pm bst on Sunday that week (After the GW preview). The thread will then be locked, not allowing anyone else to post for that week's showcase.

2) Each community member will be allowed 1 post, with up to 3 photos for projects they have finished.
     a.    This means that all your minis will be together during the showcase rather than spread-out at different times. 
     b.    A project is any Model, Unit, finished work etc… that you have completed, and which has not already been on a showcase.

3) No Instagram/Socials links in showcase section. These will not be shown on the Twitch Showcases and will be deleted.`

const token = client.send(new GetSecretValueCommand({
    SecretId: token_id
}))

export const main = async () => {

    const config: AxiosRequestConfig = {
        headers: {
            "Authorization": `Bot ${(await token).SecretString}`
        }
    }

    const startDate = new Date()
    // Create thread
    const message = await axios.post(`${endpoint}/channels/${channel}/threads`,
        {
            "name": `Sunday showcase thread! ${format(startDate, "dd/MM")}-${format(add(startDate, { days: 3 }), "dd/MM")}`,
            "type": 11
        }
        , config)

    // Send initial Message in thread
    await axios.post(`${endpoint}/channels/${message.data.id}/messages`, {
        content: initialMessage
    }, config)

    await ssmClient.send(new PutParameterCommand({
        Name: created_thread_parameter,
        Value: message.data.id,
        Overwrite: true

    }))
}