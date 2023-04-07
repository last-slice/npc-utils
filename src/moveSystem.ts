import { Schemas, Transform, engine } from "@dcl/sdk/ecs"
import { Quaternion, Vector3 } from "@dcl/sdk/math"
import { NPCLerpType, NPCState } from "./types"
import { NPCDataComponent } from "./npcData"

export const schema = {
		path: Schemas.Array(Schemas.Vector3),
		origin: Schemas.Number,
    target: Schemas.Number,
    fraction:Schemas.Number,
    totalDuration:Schemas.Number,
    speed:Schemas.Array(Schemas.Number),
    loop: Schemas.Boolean,
    type: Schemas.String,
    finshed:Schemas.Boolean,
    reachedPoint:Schemas.Boolean
}

export const NPCLerpData = engine.defineComponent("npcutils::npcLerpData", schema)

export function nPCWalkSystem(dt: number) {
  console.log('walking npc')
  for (const [entity, lerps] of engine.getEntitiesWith(NPCLerpData)) {

    let transform = Transform.getMutable(entity)
    let lerpData = NPCLerpData.getMutable(entity)
    let npcData = NPCDataComponent.get(entity)
    let npcDataM = NPCDataComponent.getMutable(entity)

    if(npcData.state == NPCState.FOLLOWPATH){
      if(lerpData.type !== undefined && lerpData.type == NPCLerpType.RIGID_PATH){
        if(lerpData.fraction < 1){
          lerpData.fraction += dt * lerpData.speed[lerpData.origin]

          transform.position = Vector3.lerp(
            lerpData.path[lerpData.origin], 
            lerpData.path[lerpData.target], 
            lerpData.fraction)
        }
        else{
          lerpData.origin = lerpData.target
          lerpData.target += 1
          if (lerpData.target >= lerpData.path.length) {
            if (lerpData.loop) {
              lerpData.target = 0
            } else {

              console.log('need to stop walking npc and execute finished callback')

              // npc.stopWalking()
              // if (lerpData.onFinishCallback) {
              //   path.onFinishCallback()
              // }
              lerpData.fraction = 1
              return
            }
          } 
          
          // else if (lerpData.onReachedPointCallback) {
          //   path.onReachedPointCallback()
          // }

          lerpData.fraction = 0 //starts on this point
          let originalRot = transform.rotation
          let lookAtTarget = lerpData.path[lerpData.target]
          let direction = Vector3.subtract(lookAtTarget, transform.position)
          transform.rotation = Quaternion.slerp(originalRot, Quaternion.lookRotation(direction), dt * 1)

        }
      }
      else{
            //default follow, smooth but with low FPS could cut corners
            //always increment fraction
            lerpData.fraction += dt * lerpData.speed[lerpData.origin]
  
            if(lerpData.fraction >= 1){
              lerpData.origin = lerpData.target
              const tartInc = Math.max(1,Math.floor( lerpData.fraction ))
              lerpData.target += tartInc
              if (lerpData.target >= lerpData.path.length) {
                if (lerpData.loop) {
                  lerpData.target = 0
                } else {

                  console.log('need to stop walking npc and execute finished callback')

                  // npc.stopWalking()
                  // if (path.onFinishCallback) {
                  //   path.onFinishCallback()
                  // }
                  lerpData.fraction = 1
                  return
                }
              } 
              
              // else if (path.onReachedPointCallback) {
              //   path.onReachedPointCallback()
              // }

              lerpData.fraction -= tartInc
              //TODO consider lerping look at
              if (lerpData.target < lerpData.path.length) {
                let originalRot = transform.rotation
                let lookAtTarget = lerpData.path[lerpData.target]
                let direction = Vector3.subtract(lookAtTarget, transform.position)
                transform.rotation = Quaternion.slerp(originalRot, Quaternion.lookRotation(direction), dt * 1)
   
              }
            }
      }
  
      //if reached target
      if (lerpData.target < lerpData.path.length) {
        transform.position = Vector3.lerp(
          lerpData.path[lerpData.origin],
          lerpData.path[lerpData.target],
          lerpData.fraction
        )
      }
    }
   
    

  }
}