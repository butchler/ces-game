(ns game.graphics-test
  (:use-macros [game.mocha :only [describe it it-async]])
  (:require [game.graphics :as g]))

(describe "game.graphics"

  (describe "request-frame/cancel-frame"
    (let [called? (atom false)
          frame-id (g/request-frame #(reset! called? true))]
      (it-async "should call the callback function rather quickly."
          (js/setTimeout #(do (assert @called?) (done)) 100))
      (it "should not fail"
          (g/cancel-frame frame-id))))

  (let [canvas (.getElementById js/document "test-canvas")]

    (describe "get-brush"
      (it "should not fail"
          (g/get-brush canvas)))

    (let [brush (g/get-brush canvas)]

      (describe "clear"
        (it "should not fail"
            (g/clear brush)))

      (describe "fill-rect"
        (it "should not fail"
            (g/fill-rect brush "blue" 100 100 100 100)))

      (describe "fill"
        (it "should not fail"
            (g/fill brush "green"))))))

