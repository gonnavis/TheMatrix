Vue.component("math-function", {
  mixins: [mixin_moveable, mixin_contextmenu],
  props: {
    initData: Object,
    selected: Boolean
  },
  data: function () {
    return {
      name: "f",
      expression: "",
      latex: 'x+1',
      mathq: ''
    }
  },
  created: function () {
    if (this.initData) {
      //console.log(this.initData);
      this.name = this.initData.name
      this.latex = this.initData.latex
    }
  },
  mounted () {
    // the MQ variable is defined in main.js and is equal to: MathQuill.getInterface(2);
    // TODO: this is throwing the two error messages at the start. Why?
    this.mathq =  MQ.MathField(this.$refs.quillspan, {
      handlers: {
        edit: this.spanEdit
      }
    })
    this.mathq.latex(this.latex)
  },
  methods: {
    save: function () {
      return {
        "name": this.name,
        "latex": this.latex,
        "position": [this.objStyle.left, this.objStyle.top],
        "type": 'math-function',
        "id": this.$attrs.id
      }
    },
    deleteObject: function () {
      this.$root.deleteObjByID(this.$attrs.id)
    },
    edit: function () {
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
    spanEdit: function () {
      //console.log("span edit");
      this.latex = this.mathq.latex()
      this.expression = this.expressionFromLatex(this.latex);
      this.$root.updateTablesWithSymbol(this.name)
      this.$root.updateGraphsWithSymbol(this.name)
      console.log(`latex: ${this.latex}\nexpression: ${this.expression}`);
    },
    expressionFromLatex: function (latexString) {
      function indexOfMatchingBracket(string) {
        // expects the string to be missing the initial open bracket
        let index;
        let c = 1
        
        for (let i = 0; i < string.length; i++) {
          const element = string[i];
          if (element == '{') {
            c += 1
          } else if (element == '}') {
            c -= 1
          }
          if (c == 0) {
            // we've found the first matching bracket
            index = i
            break
          }
        }
        return index
      }
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

        i = indexOfMatchingBracket(lastHalf)
        demo = lastHalf.slice(0, i)
        lastHalf = lastHalf.slice(i + 1) // will this throw an error?

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

        i = indexOfMatchingBracket(lastHalf)
        let expo = lastHalf.slice(0, i)
        lastHalf = lastHalf.slice(i+1)

        string = firstHalf + `^(${expo})` + lastHalf
        return string
      }
      function parseSqrt(string) {
        let i = string.lastIndexOf('\\sqrt{')
        
        // hardcoding the length of the match
        let firstHalf = string.slice(0, i)
        let lastHalf = string.slice(i + 6)

        i = indexOfMatchingBracket(lastHalf)
        let expo = lastHalf.slice(0, i)
        lastHalf = lastHalf.slice(i+1)

        string = firstHalf + `sqrt(${expo})` + lastHalf
        return string
      }
      function parseTrigFunctions(string) {
        let trigf = 'sin'
        let i = string.lastIndexOf('\\sin')
        if (i == -1) {
          i = string.lastIndexOf('\\cos')
          trigf = 'cos'
        }
        
        // hardcoding the length of the match
        let firstHalf = string.slice(0, i)
        let lastHalf = string.slice(i + 4)

        string = firstHalf + trigf + lastHalf
        return string
      }
      // find \left( and \right)
      let newString = latexString.replace(/\\left\(/g, '(')
      newString = newString.replace(/\\right\)/g, ')')

      // brackets
      newString = newString.replace(/\\left\[/g, '[')
      newString = newString.replace(/\\right\]/g, ']')

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

      // square-roots
      while (newString.match(/\\sqrt{/g) != null) {
        newString = parseSqrt(newString)
      }

      // basic trig functions
      while (newString.match(/\\sin/g) != null || newString.match(/\\cos/g) != null) {
        newString = parseTrigFunctions(newString)
      }
      
      // spaces
      newString = newString.replace(/\\ /g, '')

      return newString
    }
  },
  template: `<div draggable="true"
v-on:dragend="onDragEnd"
v-on:dragstart="onDragStart"
v-bind:style="objStyle"
v-bind:class="{ function: true, selected: selected}"

v-on:click.prevent="onClick"
v-on:contextmenu.prevent="onRightClick">
  <p><b>{{name}}</b></p>
  <p>:</p>
  <span ref="quillspan" v-bind:class="{functionQuill: true}"></span>
  <ol v-on:contextmenu.prevent="0"
  v-bind:class="{menu: true}"
  v-show="showContextMenu && selected"
  v-bind:style="contextMenuStyle">
    <li v-on:click="edit" v-bind:class="{menu: true}">Edit</li>
    <li v-on:click="deleteObject" v-bind:class="{menu: true}">Delete</li>
  </ol>
</div>`,
})