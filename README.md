![splash image](./assets/splash.png)

[![repo size](https://img.shields.io/github/repo-size/Jitera-Labs/prompt_mixer.exe?style=flat-square&labelColor=000000&color=ffffff)](https://github.com/Jitera-Labs/prompt_mixer.exe)
[![last commit](https://img.shields.io/github/last-commit/Jitera-Labs/prompt_mixer.exe?style=flat-square&labelColor=000000&color=ffffff)](https://github.com/Jitera-Labs/prompt_mixer.exe/commits/main)
[![license](https://img.shields.io/github/license/Jitera-Labs/prompt_mixer.exe?style=flat-square&labelColor=000000&color=ffffff)](https://github.com/Jitera-Labs/prompt_mixer.exe/blob/main/LICENSE)
[![Visitors](https://api.visitorbadge.io/api/combined?path=https%3A%2F%2Fgithub.com%2FJitera-Labs%2Fprompt_mixer.exe&label=visitors&labelColor=%23000000&countColor=%23ffffff&style=flat-square)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2FJitera-Labs%2Fprompt_mixer.exe)

---

An environment to explore mid-generation prompt steering.

## [DEMO]



https://github.com/user-attachments/assets/1437dcbc-2d8c-4121-9cc4-c34dc677b075



## [FEATURES]

![feature image](./assets/mixer_core.png)

A canvas to mix individual components of the prompt together. Each component is represented as an anchor. Drag and drop to position them. Distance to the center represents weight in the resulting mix.

![feature image](./assets/chat_core.png)

Minimalistic chat interface to interact with the model. Regen, edit messages. Pause and resume generation, slow it down for better control.

![feature image](./assets/settings_core.png)

Point to any OpenAI-compatible endpoint with your API key. All data is stored locally in an encrypted vault.

## [INITIATION_SEQUENCE]

```bash
# INSTALL_DEPENDENCIES
npm install

# EXECUTE_PROGRAM
npm run tauri dev
```
