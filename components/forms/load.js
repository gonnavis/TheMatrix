Vue.component("form-load", {
    props: {
      initData: Object,
      selected: Boolean
    },
    data: function () {
      return {
        data: "",
        dataType: "Object",
        reset: false,

        // styling and misc data
        styleObj: {
          'position': 'absolute',
          'left': '0px',
          'top': '0px'
        },
        showContextMenu: false,
        contextMenuStyle : {
          'position': 'absolute',
          'width': '175px',
          'left': '0px',
          'top': '0px',
        },
        dragOffsetX: 0,
        dragOffsetY: 0
      }
    },
    created: function () {
      if (this.initData) {
        //console.log(this.initData);
        this.styleObj.left = this.initData.position[0]
        this.styleObj.top = this.initData.position[1]
      }
    },
    methods: {
      //form specific
      finishForm: function () {
        try {
          this.data = JSON.parse(this.data)
        } catch (error) {
          console.error(error);
        }
        if (this.data != "") {
          for (let i = 0; i < this.data.length; i++) {
            this.$root.createObj(this.data[i])
          }
        }
        this.deleteForm()
      },
      deleteForm: function () {
        this.$root.deleteObjByID(this.$attrs.id)
      },
  
      // events
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
      }
    },
    template: `<div draggable="true"
    v-on:dragend="onDragEnd"
    v-on:dragstart="onDragStart"
    v-on:click.self="onClick"
    v-on:contextmenu.prevent="onRightClick"
  
    v-bind:class="{CreateForm:true,selected:selected}"
    v-bind:style="styleObj">
    <form onsubmit="return false">
      <label>Paste load data into the textbox:</label><br>
      <textarea v-model="data" v-bind:style="{width:'300px'}"></textarea><br>
      <button v-on:click="finishForm">Finish</button>
    </form>
    <ol v-on:contextmenu.prevent="0"
    v-bind:class="{menu: true}"
    v-show="showContextMenu && selected"
    v-bind:style="contextMenuStyle">
      <li v-on:click="deleteForm" v-bind:class="{menu: true}">Delete</li>
    </ol>
  </div>`,
  })