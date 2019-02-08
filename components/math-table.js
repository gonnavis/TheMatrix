Vue.component("math-table", {
  props: {
    initData: Object,
    selected: Boolean
  },
  data: function () {
    return {
      // some default settings
      inputHeaders: ['x'],
      inputTable: [[1], [2], [3], [4], [5]],

      outputHeaders: ['?'],
      outputTable: [['?'], ['?'], ['?'], ['?'], ['?']],
      // another idea would be connected functions on a separate table?
      dragOffsetX: 0,
      dragOffsetY: 0
    }
  },
  created: function () {
    if (this.initData) {
      //console.log(this.initData);
      this.inputHeaders = this.initData.inputHeaders
      this.outputHeaders = this.initData.outputHeaders
      this.inputTable = this.initData.inputTable
      this.outputTable = this.initData.outputTable
    }
  },
  methods: {
    changeHeader: function (index, type) {
      // select the table before getting tableInput from user
      if (this.selected) {
        switch (type) {
          case 'input':
            {
              let newHeader = prompt("Change the header?", this.inputHeaders[index])
              this.inputHeaders.splice(index, 1, newHeader)
              this.$root.updateData(this.$attrs.id, 'inputHeaders', this.inputHeaders)
            }
            break;
          case 'output':
            {
              let newHeader = prompt("Change the header?", this.outputHeaders[index])
              this.outputHeaders.splice(index, 1, newHeader)
              this.$root.updateData(this.$attrs.id, 'outputHeaders', this.outputHeaders)
            }
            break;
          default:
            {
              console.log("Default case of changeHeader method");
            }
            break;
        } 
      } else {
        this.onClick(event)
      }
    },
    changeInput: function (pos) {
      //console.log("trying to change an input");
      // select the table before getting input from user
      if (this.selected) {
        //console.log(pos);
        let row = pos[0]
        let col = pos[1]
        let userInput = prompt("Change the input?", this.inputTable[row][col])
        try {
          let newValue = parseFloat(userInput)
          // update the array
          let newRow = this.inputTable[row]
          newRow.splice(col, 1, newValue)
          this.inputTable.splice(row, 1, newRow)
          // this is the weirdest looking piece of code ever but...
          // this is how you invoke the setter function of the computed property
          this.functionsOutput = row // this throws an error
          this.$root.updateData(this.$attrs.id, 'inputTable', this.inputTable)
        } catch (error) {
          // check back here later. this output didn't seem to ever be invoked.
          console.warn("For the moment, inputs must be numbers.");
          console.warn(error);
        }
      } else {
        this.onClick(event)
      }
    },
    onDragEnd: function (event) {
      //console.log("onDragEnd function says...");
      //console.log(event);
      let x = event.x - this.dragOffsetX
      let y = event.y - this.dragOffsetY
      this.$root.updateData(this.$attrs.id, 'position', [`${x}px`, `${y}px`])
      // updating the class appropriately
      this.objHover = false
    },
    onDragStart: function (event) {
      //console.log("onDragStart function says...");
      //console.log(event);
      this.onClick(event)
      this.dragOffsetX = event.offsetX
      this.dragOffsetY = event.offsetY
    },
    onClick: function (event) {
      this.$root.selectObj(event, this.$attrs.id)
    },
    onRightClick: function (event) {
      this.$root.selectObj(event, this.$attrs.id)
      this.$root.onContextMenu(event, 'table')
    },
    evaluateAllRows: function () {
      //console.log("Evaluating...");
      for (let i = 0; i < this.inputTable.length; i++) {
        // I know this line looks strange but its what invokes the set method for the computed property.
        this.functionsOutput = i
      }
    }
  },
  computed: {
    functionsOutput: {
      get: function () {
        return this.outputTable
      },
      set: function (row) {
        //console.log(typeof row);
        // now with this index, create the variable scope object for the eval call
        let scope = {}

        for (let i = 0; i < this.inputHeaders.length; i++) {
          scope[this.inputHeaders[i]] = this.inputTable[row][i]
        }
        //console.log(scope);
        // next we need the output function string
        for (let i = 0; i < this.outputHeaders.length; i++) {
          //console.log(i);
          let func = this.$root.getFunctionString(this.outputHeaders[i])
          if (func) {
            let g = math.compile(func)
            let outputValue
            try {
              outputValue = g.eval(scope) 
            } catch (error) {
              console.warn("outputValue is not undefined because...");
              console.warn(error);
              outputValue = '?'
            }
            //console.log(outputValue);
            let newRow = this.outputTable[row]
            newRow.splice(i, 1, outputValue)
            this.outputTable.splice(row, 1, newRow)
          } else {
            let newRow = this.outputTable[row]
            newRow.splice(i, 1, '')
            this.outputTable.splice(row, 1, newRow)
          }
        }
        this.$root.updateData(this.$attrs.id, 'outputTable', this.outputTable)
      }
    }
  },
  template: `<div draggable="true"
  v-on:dragend="onDragEnd"
  v-on:dragstart="onDragStart"
  v-on:click.prevent="onClick"
  v-on:contextmenu.prevent="onRightClick($event)"
  v-bind:class="{ tableContainer: true, selected: selected}">
    <table v-bind:class="{ table: true}">
      <tr>
        <th v-for="(value, index) in inputHeaders"
        v-bind:key="index"
        v-on:click="changeHeader(index, 'input')">{{ value }}</th>
      </tr>
      <tr v-for="(value, row) in inputTable"
      v-bind:key="row">
        <td v-for="(item, col) in value"
        v-bind:key="col"
        v-on:click="changeInput([row, col])">{{item}}</td>
      </tr>
    </table>
    <p>:</p>
    <table v-bind:class="{ table: true}">
    <tr>
      <th v-for="(value, index) in outputHeaders"
      v-bind:key="index"
      v-on:click="changeHeader(index, 'output')">{{ value }}</th>
    </tr>
    <tr v-for="(value, row) in functionsOutput"
    v-bind:key="row">
      <td v-for="(item, col) in value"
      v-bind:key="col">{{item}}</td>
    </tr>
    </table>
  </div>`,
})