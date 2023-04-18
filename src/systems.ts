import { engine } from "@dcl/sdk/ecs";
import { IsFollowingPath } from "./components";
import { walkingTimers } from "./npc";

export function handlePathTimes(dt:number) {
    for (const [entity] of engine.getEntitiesWith(IsFollowingPath)) {
        if(walkingTimers.has(entity)){
            let elapsed:number = walkingTimers.get(entity)!
            elapsed += dt
            walkingTimers.set(entity, walkingTimers.get(entity)! + dt)
        }
        else{
            walkingTimers.set(entity, dt)
        }
    }
  }