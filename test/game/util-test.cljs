(ns game.util-test
  (:use-macros [game.mocha :only [describe it]])
  (:require [game.util :as util]))

(describe "game.util"
  (describe "log"
    (it "should not fail"
        (util/log 0 [1 :2 "3"] :a "b" 'c {:e \f})))

  (describe "get-current-time"
    (it "should not fail"
        (util/get-current-time))))

