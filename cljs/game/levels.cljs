(ns game.levels
  (:require [game.components :as c]))

(def levels
  [{:grid ["....................."
           "....................."
           "..p.................."
           "#####################"]
    :entities []}])

(def *cell-width*  30)
(def *cell-height* 40)

(def letters
  {"#" (c/image "images/block.png")
   "p" (c/image "images/player.png")})

(defn load-entity [letter x y]
  (let [entity (letters letter)]
    (when-not (nil? entity)
      (let [entity-with-position (merge entity (c/position x y))]
        entity-with-position))))

(defn load-row [row-index row]
  (remove nil?  (map-indexed
                  (fn [col-index letter]
                    (let [x (* col-index *cell-width*)
                          y (* row-index *cell-height*)]
                      (load-entity letter x y)))
                  row)))

(defn load-level [level]
  (let [rows (:grid level)
        grid-entities (apply concat (map-indexed load-row rows))
        additional-entities (:entities level)
        all-entities (concat grid-entities additional-entities)]
    all-entities))

