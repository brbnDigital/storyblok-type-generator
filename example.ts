import StoryblokTypeGenerator from "./lib/index"

StoryblokTypeGenerator.Connect("YOUR_PERSONAL_ACCESS_TOKEN")
    .then(async TypeGenerator => await TypeGenerator.Generate("YOUR_SPACE_ID"))
    .catch(error => console.error(error))
