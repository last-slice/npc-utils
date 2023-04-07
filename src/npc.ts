import { Animator, AvatarShape, Billboard, BillboardMode, engine, Entity, executeTask, GltfContainer, InputAction, Material,MeshCollider,MeshRenderer,pointerEventsSystem,Transform, TransformType } from '@dcl/sdk/ecs'
import { Color3, Quaternion, Vector3 } from '@dcl/sdk/math'
import { addFaceUserSystem, TrackUserFlag } from './faceUserSystem'
import { FollowPathData, NPCData, NPCLerpType, NPCState, NPCType, OnActivate, TriggerData } from './types';
import { NPCDataComponent } from './npcData';
import { NPCLerpData, nPCWalkSystem } from './moveSystem';
import * as utils from '@dcl-sdk/utils'

const isCooldown: Map<Entity, any> = new Map()
const onActivateCbs: Map<Entity, any> = new Map()
const onWalkAwayCbs: Map<Entity, any> = new Map()


    function addNPCBones(npc:Entity, data:NPCData){
        switch(data.type){
            case NPCType.AVATAR:
                AvatarShape.create(npc, {
                    id: "npc",
                    name: "NPC",
                    bodyShape:"urn:decentraland:off-chain:base-avatars:BaseMale",
                    emotes: [],
                    wearables: [
                        "urn:decentraland:off-chain:base-avatars:f_eyes_00",
                        "urn:decentraland:off-chain:base-avatars:f_eyebrows_00",
                        "urn:decentraland:off-chain:base-avatars:f_mouth_00",
                        "urn:decentraland:off-chain:base-avatars:comfy_sport_sandals",
                        "urn:decentraland:off-chain:base-avatars:soccer_pants",
                        "urn:decentraland:off-chain:base-avatars:elegant_sweater",
                        ],
                })
                break;

            case NPCType.CUSTOM:
                GltfContainer.create(npc, { 
                    src: data && data.model ? data.model : "" 
                })
                Animator.create(npc, {
                    states:[]
                })
                break;

            case NPCType.BLANK:
                MeshRenderer.setBox(npc)
                MeshCollider.setBox(npc)
                break;

        }
    }

    function addClickReactions(npc:Entity, data:NPCData){
        pointerEventsSystem.onPointerDown(
            npc,
            function () {
                if (isCooldown.has(npc)) return// || (npcData.dialog && this.dialog.isDialogOpen)) return
                console.log("clicked entity")
                activate(npc)
            },
            {
              button: InputAction.IA_POINTER,
              hoverText: data && data.hoverText ? data.hoverText : 'Talk',
              showFeedback: data && data.onlyExternalTrigger ? false : true,
            }
          )

          if (data && data.onlyExternalTrigger) {
            pointerEventsSystem.removeOnPointerDown(npc)
          } 
    }

    function addTriggerArea(npc:Entity, data:NPCData){

         let triggerData: TriggerData = {}

         if (!data || (data && !data.onlyExternalTrigger && !data.onlyClickTrigger && !data.onlyETrigger)){
            onActivateCbs.set(npc, ()=>{
                if (isCooldown.has(npc)) {
                    console.log(npc, ' in cooldown')
                    return
                } 
                // else if (
                //     (this.dialog && this.dialog.isDialogOpen) ||
                //     (data && data.onlyExternalTrigger) ||
                //     (data && data.onlyClickTrigger)
                // ) {
                //     return
                // }
                data.onActivate()
            })
            triggerData.onCameraEnter = onActivateCbs.get(npc)
         }

        // when exiting trigger
        if (!data || (data && !data.continueOnWalkAway)) {
            triggerData.onCameraExit = () => {
                handleWalkAway(npc)
            }
        }
    
        // when entering trigger
        if (
            !data ||
            (data && !data.onlyExternalTrigger && !data.onlyClickTrigger && !data.onlyETrigger)
        ) {
            triggerData.onCameraEnter = () => {
                if (isCooldown.has(npc)) {
                    console.log(npc, ' in cooldown')
                    return
                } 
                // else if (
                //     (this.dialog && this.dialog.isDialogOpen) ||
                //     (data && data.onlyExternalTrigger) ||
                //     (data && data.onlyClickTrigger)
                // ) {
                //     return
                // }
                activate(npc)
            }
        }
  
    
        // add trigger
        if (triggerData.onCameraEnter || triggerData.onCameraExit) {
            let pos = Transform.get(npc).position
            
            utils.triggers.addTrigger(npc,0,0, [],[{position: Vector3.create(pos.x, pos.y, pos.z), radius: data.reactDistance != undefined ? data.reactDistance : 6}], triggerData.onCameraEnter ? triggerData.onCameraEnter : undefined, triggerData.onCameraExit ? triggerData.onCameraExit : undefined, Color3.Red())
        }


        // if (data && data.faceUser) {
        //     Billboard.create(npc, {
        //         billboardMode:BillboardMode.BM_Y
        //     })
        // }
    }

    function followPath(npc:Entity, data:FollowPathData){
        

        let totalDist = 0
        let pointsDist = []
        for (let i = 0; i < data.path!.length - 1; i++) {
            let sqDist = Vector3.distance(data.path![i], data.path![i + 1])
            totalDist += sqDist
            pointsDist.push(sqDist)
        }

        if (data.loop) {
            let sqDist = Vector3.distance(data.path![data.path!.length - 1], data.path![0])
            totalDist += sqDist
            pointsDist.push(sqDist)
        }

        if (data && data.totalDuration) {
            data.totalDuration = data.totalDuration
          } else if (data && data.speed) {
            data.totalDuration = totalDist / data.speed
          } else if (!data.totalDuration) {
            data.totalDuration = totalDist / 2
          }

        
        let finishedCallback
        if(!data.loop){
            if(data && data.onFinishCallback){
                finishedCallback = data.onFinishCallback
            }
        }

        if(data.pathLerpType){
            if(data.pathLerpType == NPCLerpType.RIGID_PATH){
                utils.paths.startStraightPath(npc, data.path!, data.totalDuration, data.loop != undefined ? data.loop : true, true, finishedCallback ? finishedCallback : undefined, data.onReachedPointCallback ? data.onReachedPointCallback : undefined)
            }
            else{
                utils.paths.startSmoothPath(npc, data.path!, data.totalDuration, 30, data.loop != undefined ? data.loop : true, true, finishedCallback ? finishedCallback : undefined) //onReachedCallback does not exist for the smooth path utils function
            }
        }
        else{
            utils.paths.startSmoothPath(npc, data.path!, data.totalDuration, 30, data.loop != undefined? data.loop : true, true, finishedCallback ? finishedCallback : undefined) //onReachedCallback does not exist for the smooth path utils function
        }

        

    }

    export function createNPC(
        transform: TransformType,
        data: NPCData
    ){
        let npc = engine.addEntity()

        Transform.create(npc, transform)

        NPCDataComponent.create(npc,{
            introduced: false,
            inCooldown: false,
            coolDownDuration: 5,
            faceUser:data.faceUser,
            walkingSpeed:2,
            bubbleHeight:2,
        })

        onActivateCbs.set(npc, ()=>{
            data.onActivate()
        })

        if (data && data.onWalkAway) {
            onWalkAwayCbs.set(npc, ()=>{
                data.onWalkAway
            })
          }

        addNPCBones(npc, data)
        addClickReactions(npc, data)
        addTriggerArea(npc, data)
      
        if (data && data.pathData && data.pathData.speed) {
            let npcData = NPCDataComponent.getMutable(npc)
            npcData.walkingSpeed = data.pathData.speed
        }
    
        if (data && data.coolDownDuration) {
            let npcData = NPCDataComponent.getMutable(npc)
            npcData.coolDownDuration = data.coolDownDuration
        }

        if (data && data.pathData){
            followPath(npc, data.pathData)
        }

        return npc
    }

    export function stopWalking(npc:Entity, duration?: number) {

        let npcData = NPCDataComponent.getMutable(npc)
        npcData.state = NPCState.STANDING
        npcData.lastPlayedAnim = npcData.idleAnim
    
        if (npcData.walkingAnim) {
            Animator.playSingleAnimation(npc, npcData.walkingAnim)
            npcData.lastPlayedAnim = npcData.idleAnim
        }
    
        if (duration) {
            // npcDelayDuration = duration
            // npcDelays.set(npc,)
            // npcTimerReachedMap.set(npc, ()=>{

            // })
            // onTimerReachedCallback = () => {
            //     if (this.dialog && this.dialog.isDialogOpen) return
            //     this.lastPlayedAnim.stop()
            //     if (this.walkingAnim) {
            //       this.walkingAnim.play()
            //       this.lastPlayedAnim = this.walkingAnim
            //     }
            //     if (this.endAnimTimer.hasComponent(NPCDelay)) {
            //       this.endAnimTimer.removeComponent(NPCDelay)
            //     }
            //     this.state = NPCState.FOLLOWPATH
            //   })
            // engine.addSystem(npcDelay)
        }
    }


   /**
   * Calls the NPC's activation function (set on NPC definition). If NPC has `faceUser` = true, it will rotate to face the player. It starts a cooldown counter to avoid reactivating.
   */
  function activate(npc:Entity) {
    onActivateCbs.get(npc)()

    let npcData = NPCDataComponent.get(npc)
    if (npcData.faceUser) {
        Billboard.create(npc, {
            billboardMode:BillboardMode.BM_Y
        })
    }
    isCooldown.set(npc, true)

    utils.timers.setTimeout(
        function() { isCooldown.delete(npc)},
        1000 * npcData.coolDownDuration
      )
  }

    function endInteraction(npc:Entity) {
        // let npcData = NPCDataComponent.getMutable(npc)
        // if (npcData.faceUser) {
        //   this.getComponent(TrackUserFlag).active = false
        // }
        // if (this.dialog && this.dialog.isDialogOpen) {
        //   this.dialog.closeDialogWindow()
        // }
        // if (this.bubble && this.bubble.isBubleOpen) {
        //   this.bubble.closeDialogWindow()
        // }
        // npcData.state = NPCState.STANDING
    }

  /**
   * Ends interaction and calls the onWalkAway function
   */
  function handleWalkAway(npc:Entity) {
    let npcData = NPCDataComponent.get(npc)
    if (npcData.state == NPCState.FOLLOWPATH) {
      //|| this.state == NPCState.FOLLOWPLAYER
      return
    }

    endInteraction(npc)

    if (onWalkAwayCbs.get(npc)) {
        onWalkAwayCbs.get(npc)()
    }
  }
