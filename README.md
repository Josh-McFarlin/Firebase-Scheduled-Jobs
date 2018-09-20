# Firebase-Scheduled-Jobs
An example of how to implement user-scheduled jobs for running Firebase Functions

---

I ran into needing this solution after working on a project which required users to have the ability to schedule functions to run at any time and at repeating intervals if necessary.
The Firebase blog includes a method for running cron-jobs, but it is only for predefined Firebase functions.

The main Firebase function, `scheduleJobs`, works by iterating over all jobs defined in the node `/scheduledJobs` in Firebase's realtime database.
If a job's scheduled time is before or at the current time, the jobs information is copied over to the node `/runningJobs` in the database.
If a job is set to repeat on an interval, the job's run time is set to the next interval.
If a job is only supposed to run once, or it is set to stop repeating after a time which has passed, it is deleted from `/scheduledJobs`.

Another Firebase function, `executeJobs`, uses a hook listening for the creation of each job in `/runningJobs`, when a new job is added,
it runs the associated function in `custom-functions.ts`. After the function has completed, it is deleted from `/runningJobs`.

---

### Instructions
1. Deploy the functions to Firebase
2. Setup your Realtime Database to use the same format as example-firebase-export.json
3. Get the url for the scheduleJobs function from the functions dashboard page, it should be a url similar to https://SERVERLOCATION-PROJECTNAME.cloudfunctions.net/scheduleJobs
4. Setup a cron-job service to hit the function url every minute

Example cron-job service: https://cron-job.org/en/


If your functions in `custom-functions.ts` take longer than 9 minutes to complete, you will need to extend the timeout time of the `executeJobs` function, which can be done from the Google Cloud Functions dashboard by clicking on `executeJobs` and then clicking edit.

---

### Example Realtime Database
```
{
  "scheduledJobs" : {
    "ABC" : {
      "args" : {
        "logMe" : "Hello, this is a basic job!"
      },
      "runAt" : 1537356593000,
      "worker" : "logArg"
    },
    "DEF" : {
      "args" : {
        "logMe" : "This is a job that repeats every 2 minutes forever!"
      },
      "repeat" : {
        "interval" : 2
      },
      "runAt" : 1537356593000,
      "worker" : "logArg"
    },
    "GHI" : {
      "args" : {
        "logMe" : "This is a repeating job that repeats every 3 minutes until the unix time: 1538356660!"
      },
      "repeat" : {
        "endOn" : 1538356660000,
        "interval" : 3
      },
      "runAt" : 1537356660000,
      "worker" : "logArg"
    }
  }
}
```

#### Additional Info
`worker` is the function that will be called when it is the job's turn to run, and `args` are the arguments that will be passed to the function. They are equivalent to calling `worker(args)`.

`runAt` and `repeat.endOn` are the millisecond representation of the unix time of a date and time.

`repeat.interval` is an optional integer for how often to repeat the job in minutes. As the cron-job service only activates the function once a minute, it is not possible to use sub-minute specification.
