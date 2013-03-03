(ns game.core-test
  (:use-macros [game.mocha :only [describe it]])
  (:require [game.core :as game-loop]))

(describe "game.core"

  (describe "start/run/resume/pause"
    (it "should not fail"
        (defmethod game-loop/update :default [game-state seconds-elapsed])
        (defmethod game-loop/draw :default [game-state])
        (let [game-state (game-loop/start {:mode :default})]
          (game-loop/pause game-state)
          (game-loop/resume game-state)
          (game-loop/pause game-state)
          (game-loop/pause game-state)
          (game-loop/pause game-state)
          (game-loop/pause game-state)
          (game-loop/pause game-state)
          (game-loop/resume game-state)
          (game-loop/resume game-state)
          (game-loop/resume game-state)
          (game-loop/pause game-state)))))

