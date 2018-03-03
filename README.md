# kie-creator ![npm tag)(https://badge.fury.io/js/kie-creator.svg)
> Brackets extension for kie project that allows quick creation of content

# Introduction

## The idea

Brackets creator is a tool that allow creators to select parts of code and add them meaning in context of their tutorials. 

## Instalation

You can use Brackets Extension registry or install it manualy (see Brackets [guide](https://github.com/adobe/brackets/wiki/Brackets-Extensions))

## Usage 

Once installed, Koduje logo should be visible on the right panel of Brackets. Clicking it will open a bottom panel in which you can modify your future tutorial.

You develop your project normally, as you would develop any kind of your personal projects. Once you're ready to "commit" your progress, you can save your open projct and develop it even further. Long story short, you can think of export/import capabilities of this extension as poor version of git commits. 

Once you're ready and want to "deploy" your tutorial, click merge in the bottom panel. That will create a `__merged.json` file in project root.

Note that files/directories that start with `__` will be excluded in final export of the tutorial - so if you don't want something from your project to be included in final bundle, prefix them with `__`. 

You also need to create `__config.json` and `__exercise.html` in project root. `__exerciese.html` file will contain the contents of your tutorial that the user will see - so if you want to say anything to the final reader - thats the place where you should place those thoughts.


`__config.json` contains few config options for your tutorial. 

```json
{
  "root": "flexbox", 
  "id": "flexbox/chapter",
  "title": "Tworzymy nasz pierwszy layouts na flexie",
  "description": "W tym rozdziale stworzymy layout prostej strony przy użyciu flexboxa",
  "previousURL": "flexbox/skrocona-notacja-shorthands",
  "nextURL": "flexbox/podsumowanie"
}
```

* *root* - if your tutorials have more chapters, those will be placed in a `root` directory in final bundle. This will probably be depracated soon in favour of better solutions.
* *id* - unique id of this particular chapter of your tutorial. Used for various stuff as navigation between chapters, generating unique disqus threads etc.
* *title* - title of this chapter, that'll be visible to user
* *description* - description of the chapter, also visible to user
* *previousURL* - for now acts as a way of defining the order of the chapters. You should provide an `id` of previous chapter as a value of this field
* *nextURL* - similar as `previousURL` but for following chapters.
* *ytUrl* - specify an YT video link that'll be embeded in the final bundle.

If you run `kie` command and point its `--content_path` to the place where you develop your tutorials (the same directory should be edited with `kie-creator`) you can develop your tutorials in nice, live-realoding environment. 


## Todo list: 

- [ ] kie-creator
    - [ ] rewrite to use async/await

# License 

**[kie-creator](https://github.com/worie/kie-creator)** by [Wojciech Połowniak](https://twitter.com/wopolow) is licensed under [MPL 2.0](LICENSE) [(read more)](https://www.mozilla.org/en-US/MPL/2.0/FAQ/).

<!-- recheck if brackets extensions can be published as MPL -->