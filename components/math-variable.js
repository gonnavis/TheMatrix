Vue.component("math-variable", {
  mixins: [mixin_moveable],
  props: {
    initData: Object,
    selected: Boolean
  },
  data: function () {
    return {
      // some default settings
      name: 'x',
      value: 0,

      // styling and misc data
      showContextMenu: false,
      contextMenuStyle : {
        'position': 'absolute',
        'width': '175px',
        'left': '0px',
        'top': '0px',
      },
      objHover: false,
    }
  },
  created: function () {
    if (this.initData) {
      //console.log(this.initData);
      this.name = this.initData.name
      this.value = this.initData.value
    }
  },
  methods: {
    save: function () {
      return {
        "name": this.name,
        "value": this.value,
        "position": [this.objStyle.left, this.objStyle.top],
        "type": 'math-variable',
        "id": this.$attrs.id
      }
    },
    deleteObject: function () {
      this.$root.deleteObjByID(this.$attrs.id)
    },
    edit: function () {
      if (this.selected) {
        let x = prompt(`What would you like to rename ${this.name} to?`, this.name)
        if (x) {
          this.$root.removeFromGlobalScope(this.name)
          this.name = x
          this.$root.updateGlobalScope(x, this.value)
        } 
      } else {
        this.onClick()
      }
    },
    changeValue: function () {
      if (this.selected) {
        let x = prompt(`What would you like to change the value to?`, this.value)
        if (x) {
          let num = parseFloat(x)
          if (num == x) {
            this.value = num
            this.$root.updateGlobalScope(this.name, this.value)
          } else {
            console.warn("Only using numbers for variables at this point");
            this.value = '?'
            this.$root.updateGlobalScope(this.name, this.value)
          }
        } 
      } else {
        this.onClick()
      }
    },

    // events
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
v-on:dragenter="objHover = true"
v-on:dragleave="objHover = false"
v-on:click.prevent="onClick"
v-on:contextmenu.prevent="onRightClick"

v-bind:style="objStyle"
v-bind:class="{variable:true, selected:selected, objHover:objHover}">
  <span>{{name}}</span>
  <span>=</span>
  <span v-on:click="changeValue">{{value}}</span>
  <ol v-on:contextmenu.prevent="0"
  v-bind:class="{menu: true}"
  v-show="showContextMenu && selected"
  v-bind:style="contextMenuStyle">
    <li v-on:click="edit" v-bind:class="{menu: true}">Edit</li>
    <li v-on:click="deleteObject" v-bind:class="{menu: true}">Delete</li>
  </ol>
</div>`,
})