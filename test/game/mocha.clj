(ns game.mocha
  "Simple bindings for Mocha testing framework.")

(defmacro describe [thing & forms]
  `(js/describe ~thing (fn [] ~@forms)))

(defmacro it
  ([should]
   ;; Pending test case (i.e. a test case that hasn't been written yet).
  `(js/it ~should))
  ([should & forms]
  `(js/it ~should (fn [] ~@forms))))

(defmacro it-async [should & forms]
  `(js/it ~should (fn [~'done] ~@forms)))
