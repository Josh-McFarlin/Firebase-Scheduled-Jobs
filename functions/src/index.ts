import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

import * as customFunctions from "./custom-functions";


export const scheduleJobs = functions.https.onRequest(async (req, res) => {
    const db = admin.database();

    db.ref('scheduledJobs').once("value").then(snapshot => {
        let numRunning = 0;

        snapshot.forEach(job => {
            let vals = job.val();
            let runAt = new Date(vals.runAt);
            let currentTime = new Date();

            if (runAt <= currentTime) {
                numRunning++;

                if (vals.hasOwnProperty("repeat")) {
                    let interval = vals.repeat.interval;

                    job.ref.update({
                        runAt: ((Math.floor((currentTime.getTime() - runAt.getTime()) / (interval * 60000)) + 1) * (interval * 60000)) + runAt.getTime()
                    });

                    if (vals.repeat.hasOwnProperty("endOn") && new Date(vals.repeat.endOn) <= currentTime) {
                        job.ref.remove();
                    }
                } else {
                    job.ref.remove();
                }

                db.ref("runningJobs/" + job.key).set({
                    worker: vals.worker,
                    args: vals.args
                });
            }
        });

        res.status(200).send(`Done! About to run ${numRunning} jobs!`);
    });
});

export const executeJobs = functions.database.ref("/runningJobs/{job}").onCreate(async job => {
    console.log(`${new Date().toUTCString()}: Running job: ${job.key} with worker: ${job.val().worker}.`);

    return customFunctions[job.val().worker](job.val().args).then(result => {
        console.log(`${new Date().toUTCString()}: ${result}`);
    }, error => {
        console.error(`${new Date().toUTCString()}: ${error}`);
    }).then(() => {
        return job.ref.remove();
    });
});
