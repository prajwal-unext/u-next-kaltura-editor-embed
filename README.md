# UnextKalturaEditorAppEmbed

This Project is created to replicate the error caused by the KEA which trying to preview the video in the Quiz Tab. 


## Steps to Reproduce
1. Clone this repo.
2. npm install
3. Update the `config` in src/app/app.component.ts
4. Run the project using `npm start`
5. Go to Quiz Tab
6. Click on Preview

The Player will get stuck in its loading state.
