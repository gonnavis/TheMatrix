Vue.component("math-function", {
  props: {
    initData: Object,
    selected: Boolean
  },
  data: function () {
    return {
      // the default function name
      // used as a referrence for other functions
      name: "f",
      expression: "x + 1",
      latex: 'x+1',
      mathq: '',
      
      // styling and misc data
      styleObj: {
        'position': 'absolute',
        'left': '0px',
        'top': '0px',
        'display': 'flex',
        'flex-direction': 'row'
      },
      showContextMenu: false,
      contextMenuStyle : {
        'position': 'absolute',
        'left': '0px',
        'top': '0px',
      },
      // For moving around on the scene
      dragOffsetX: 0,
      dragOffsetY: 0,
    }
  },
  created: function () {
    if (this.initData) {
      //console.log(this.initData);
      this.name = this.initData.name
      this.expression = this.initData.expression
      this.latex = this.initData.latex
      this.styleObj.left = this.initData.position[0]
      this.styleObj.top = this.initData.position[1]
    }
  },
  mounted: function () {
    this.mathq =  MQ.MathField(this.$refs.quillspan, {
      handlers: {
        edit: this.spanEdit
      }
    })
    this.mathq.latex(this.latex)
  },
  methods: {
    changeName: function () {
      if (this.selected) {
        let newName = prompt("what would you like to change the name to?", this.name)
        if (newName && this.name != newName) {
          this.name = newName
          this.$root.updateTablesWithSymbol(this.name)
        } 
      } else {
        this.onClick(event)
      }
    },
    toObject: function () {
      return {
        "name": this.name,
        "expression": this.expression,
        "latex": this.latex,
        "position": [this.styleObj.left, this.styleObj.top],
        "type": 'math-function',
        "id": this.$attrs.id
      }
    },
    spanEdit: function () {
      //console.log("span edit");
      this.latex = this.mathq.latex()
      this.expression = this.expressionFromLatex(this.latex);
      this.$root.updateTablesWithSymbol(this.name)
      //console.log(`latex: ${this.latex}\nexpression: ${this.expression}`);
    },
    expressionFromLatex: function (latexString) {
      function parseFraction(string) {
        let i = string.lastIndexOf('\\frac{')
        
        // hardcoding the length of the match
        let firstHalf = string.slice(0, i)
        let lastHalf = string.slice(i + 6)

        // getting the numerator is easy
        i = lastHalf.lastIndexOf('}{')
        let numi = lastHalf.slice(0, i)
        let demo = '' // for safe keeping

        // and then we can adjust the last part of the string accordingly
        lastHalf = lastHalf.slice(i+2)

        let c = 1
        let demoC = undefined
        for (let i = 0; i < lastHalf.length; i++) {
          const element = lastHalf[i];
          if (element == '{') {
            c += 1
          } else if (element == '}') {
            c -= 1
          }
          if (c == 0) {
            // then we know we've got to the end of the denominator
            demo = lastHalf.slice(0, i)
            demoC = i + 1
            break
          }
        }
        lastHalf = lastHalf.slice(demoC) // will this throw an error?

        //console.log(`first: ${firstHalf}\nlast: ${lastHalf}`);
        // yes theres a lot of brackets but if they weren't there
        // we'd have to worry about the order of operations.
        string = firstHalf + `((${numi})/(${demo}))` + lastHalf
        return string
      }
      function parseExponent(string) {
        let i = string.lastIndexOf('^{')
        
        // hardcoding the length of the match
        let firstHalf = string.slice(0, i)
        let lastHalf = string.slice(i + 2)

        
        let c = 1
        let demoC = undefined
        let expo;
        for (let i = 0; i < lastHalf.length; i++) {
          const element = lastHalf[i];
          if (element == '{') {
            c += 1
          } else if (element == '}') {
            c -= 1
          }
          if (c == 0) {
            // then we know we've got to the end of the denominator
            expo = lastHalf.slice(0, i)
            demoC = i + 1
            break
          }
        }
        lastHalf = lastHalf.slice(demoC)

        string = firstHalf + `^(${expo})` + lastHalf
        return string
      }
      // find \left( and \right)
      let newString = latexString.replace(/\\left\(/g, '(')
      newString = newString.replace(/\\right\)/g, ')')

      // replace any cdot's (which is multiply)
      newString = newString.replace(/\\cdot/g, '*')

      // division requires some extra work
      while (newString.match(/\\frac{/g) != null) {
        newString = parseFraction(newString)
      }

      // non-trival exponents need attention
      while (newString.match(/\^{/g) != null) {
        newString = parseExponent(newString)
      }
      
      // Check this later... may not need these next three lines
      // at the end we remove any extra {}'s
      newString = newString.replace(/{/g, '')
      newString = newString.replace(/}/g, '')

      return newString
    },
    deleteFunction: function () {
      this.$root.deleteObjByID(this.$attrs.id)
    },
    onDragEnd: function (event) {
      let x = event.x - this.dragOffsetX
      let y = event.y - this.dragOffsetY
      this.styleObj.left = `${x}px`
      this.styleObj.top = `${y}px`
    },
    onDragStart: function (event) {
      this.onClick()
      this.dragOffsetX = event.offsetX
      this.dragOffsetY = event.offsetY
    },
    onClick: function () {
      this.$root.selectObj(this.$attrs.id)
      this.showContextMenu = false
    },
    onRightClick: function (event) {
      this.$root.selectObj(this.$attrs.id)
      //console.log(event);
      this.contextMenuStyle.left = `${event.layerX}px`
      this.contextMenuStyle.top = `${event.layerY}px`
      this.showContextMenu = true
    },
  },
  template: `<div draggable="true"
v-on:dragend="onDragEnd"
v-on:dragstart="onDragStart"
v-bind:style="styleObj"
v-bind:class="{ function: true, selected: selected}"

v-on:click.prevent="onClick"
v-on:contextmenu.prevent="onRightClick">
  <p v-on:click.prevent="changeName">{{name}}</p>
  <p>:</p>
  <span ref="quillspan"></span>
  <ol v-on:contextmenu.prevent="0"
  v-bind:class="{menu: true}"
  v-show="showContextMenu && selected"
  v-bind:style="contextMenuStyle">
    <li v-on:click="deleteFunction" v-bind:class="{menu: true}">Delete</li>
  </ol>
</div>`,
})

/*

    changeExpression: function () {
      if (this.selected) {
        let newExpression = prompt("what would you like to change the name to?", this.expression)
        if (newExpression && this.expression != newExpression) {
          this.expression = newExpression
          this.$root.updateTablesWithSymbol(this.name)
        } 
      } else {
        this.onClick(event)
      }
    },
*/