# general-runtime

[![codecov](https://codecov.io/gh/voiceflow/general-runtime/branch/master/graph/badge.svg?token=WHYHNCC9FW)](https://codecov.io/gh/voiceflow/general-runtime)

`general-runtime` is an http webhook service that handles voiceflow prototype requests and generates a response. It manages the state of the user based on the programs (flows) made on the Voiceflow Creator tool.

> ⚠️ **This repository is still undergoing active development**: Major breaking changes may be pushed periodically and the documentation may become outdated - a stable version has not been released

# how interaction works

A `Context` consists of the `request`, the `state`, and the the `trace`.
The `general-runtime` recieves a `Context` without trace, and responds with a `Context` with the trace.
`request` is an object representing something the user has done, the `state` is their metadata on the voiceflow project,
and the `trace` is an list of things for whatever is calling the `general-runtime` to show.

1. user says/types something to the client, add the `request` to the `Context` and sends it via webhook to `general-runtime`
2. fetch project version data based on parameters from the [env file](documentation/env.md)
3. fetch the current program (flow) that the user is on from [env file](documentation/env.md)
4. go through each block/flow and update the user `state`
5. generate a `Context` based on the final user state, send back to prototype tool
6. client interprets response and presents it to the user

repeat all steps each time a user speaks/types to the prototype tool, to perform a conversation.

An simplified example **request** `Context` going into `general-runtime`:

```
{
  "request": { type: "text", payload: "What is the balance in my chequing account" },
  "state": {
    "stack": [{
      programID: "home flow",
      nodeID: "start block"
    }],
    "storage": {},
    "variables": {
      "chequing_balance": null
    }
  }
}
```

An simplified example **response** `Context` coming out of `general-runtime`:

```
{
  "request": {
    "type": "intent",
    "payload": {
      "name": "balance_intent",
      "entities": {
        "name": "account",
        "value": "chequing"
      }
      "query": "What is the balance in my chequing account"
    }
  },
  "state": {
    "stack": [{
      programID: "home flow",
      nodeID: "choice block 2"
    }],
    "storage": {},
    "variables": {
      "chequing_balance": 120
    }
  },
  "trace": [{
    "type": "speak",
    "payload": {
      "type": "message",
      "message": "the balance in your chequing account is 120 dollars, is that all?"
    },
  }, {
    "type": "choice",
    "payload": {
      "choices": [{"name": "yes"}, {"name": "no"}]
    }
  }],
}
```

Notice that the text `request` got processed by the NLP handler to become an intent type `request`.
The `state` is updated, and a `trace` is generated.

# setup

run `yarn` in command line to install all dependencies.

Add the following file to the local repository:

> `.env.local`
>
> ```
> PORT=4000
> LOG_LEVEL="info"
> MIDDLEWARE_VERBOSITY="none"
>
> GENERAL_SERVICE_ENDPOINT='https://general-service.voiceflow.com'
>
> CODE_HANDLER_ENDPOINT="none"
> INTEGRATIONS_HANDLER_ENDPOINT="none"
> API_HANDLER_ENDPOINT="none"
>
> CREATOR_API_ENDPOINT='https://api.voiceflow.com'
> CREATOR_API_AUTHORIZATION='[YOUR JWT TOKEN HERE]'
>
> # uncomment PROJECT_SOURCE to use local file
> # PROJECT_SOURCE='file.vfr'
> ```
>
> For more info on [Environment Variables](documentation/env.md)

# Notable Code Locations

[Documentation](https://voiceflow-general-runtime.netlify.app)<br/>
[Context Handlers](https://voiceflow-general-runtime.netlify.app/modules/controllers_interact.html) - handlers for processing request<br/>
[lib/services/runtime/handlers](https://github.com/voiceflow/general-runtime/tree/master/lib/services/runtime/handlers) - handlers for all the various blocks and defining their behavior
