import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { createNPC } from './npc'
import { NPCLerpType, NPCType } from './types'

// export all the functions required to make the scene work
export * from '@dcl/sdk'

let path = [
  Vector3.create(5, 1, 5),
  Vector3.create(5, 1, 11),
  Vector3.create(11, 1, 11),
  Vector3.create(11, 1, 5)
]

let npc = createNPC({position: Vector3.create(8,1,8), rotation:Quaternion.Zero(), scale: Vector3.create(1,1,1)}, {
  type: NPCType.BLANK,
  faceUser: true,
  hoverText: "Custom Hover Text",
  onActivate:()=>{
    console.log("test onctivate function")
  }
  // pathData:{
  //   path:path,
  //   loop:false,
  //   pathLerpType: NPCLerpType.RIGID_PATH,
  //   onFinishCallback:()=>{console.log('path is done')},
  //   onReachedPointCallback:()=>{console.log('ending oint')},
  //   totalDuration: 10
  // }
})
