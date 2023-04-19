


import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { Button, Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Entity } from '@dcl/sdk/ecs'
import { displayDialog, getText, handleDialogClick } from './dialog'

export let lightTheme = ('https://decentraland.org/images/ui/light-atlas-v3.png')
export let darkTheme = ('https://decentraland.org/images/ui/dark-atlas-v3.png')

export let bubblesTexture = ('https://decentraland.org/images/ui/dialog-bubbles.png')

export let dialogs:Map<Entity, any> = new Map()

export function createDialog(npc:Entity){
	dialogs.set(npc,
	ReactEcsRenderer.setUiRenderer(() => (
		<UiEntity
		uiTransform={{
		  width: '100%',
		  height: '300px',
		  display: displayDialog(npc) ? 'flex' :'none',
		  justifyContent: 'center',
		  flexDirection:'row',
		  alignItems:'flex-end',
		  alignContent:"flex-end",
		  alignSelf:'auto',
		  positionType:'absolute',
		  position:{top:'50%'}
		}}
	  >
		<UiEntity
		  uiTransform={{
			width: '700px',
			height: '225px',
			alignItems: 'center',
			justifyContent:'center',
		  }}
		  uiBackground={{ color: Color4.fromHexString("#70ac76ff") }}
		  onMouseDown={() => { handleDialogClick(npc) } }
		  >

		<UiEntity
				uiTransform={{
					width: '100px',
					height: '300px',
					alignItems: 'center',
					justifyContent:'flex-start'
				}}
				uiText={{value: getText(npc), fontSize: 22}}
				>
			</UiEntity>
		 </UiEntity>
	  </UiEntity>
	))
	)
}
