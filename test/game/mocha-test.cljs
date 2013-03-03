(ns game.mocha-test
  (:use-macros [game.mocha :only [describe it]]))

#_ (describe "Mocha testing framework"

  (it "should tell me that this test worked"
      (assert (= (* 2 2) 4)))

  (it "should tell me that this test failed"
      (assert (= (+ 1 2) 4))))

