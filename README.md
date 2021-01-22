# general-runtime

[![codecov](https://codecov.io/gh/voiceflow/general-runtime/branch/master/graph/badge.svg?token=WHYHNCC9FW)](https://codecov.io/gh/voiceflow/general-runtime)

`general-runtime` is an http webhook service that handles voiceflow prototype requests and generates a response. It manages the state of the user based on the programs (flows) made on the Voiceflow Creator tool.

> ⚠️ **This repository is still undergoing active development**: Major breaking changes may be pushed periodically and the documentation may become outdated - a stable version has not been released

## client architecture

![client architecture](https://user-images.githubusercontent.com/5643574/92404808-5a927e00-f102-11ea-8229-dc7bb1c9c15b.png)

### anatomy of an interaction

1. user says/types something to prototype tool, prototype tool uses regex to transcribe user intent, then sends it via webhook (along with other metadata i.e. _userID_) to `general-runtime`
2. fetch user state (JSON format) from **end user session storage** based on a _userID_ identifier
3. fetch project version data for initialization parameters from **Voiceflow API/Project File**
4. fetch the current program (flow) that the user is on from **Voiceflow API/Project File**
5. go through each block and update the user state
6. save the final user state to **end user session storage**
7. generate a response based on the final user state, send back to prototype tool
8. prototype tool interprets response and speaks to user

repeat all steps each time a user speaks/types to the prototype tool, to perform a conversation

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
