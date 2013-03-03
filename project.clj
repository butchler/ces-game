(defproject ces-game "0.1.0-SNAPSHOT"
  :description "Simple game using Component/Entity/System model."
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojurescript "0.0-1586"]]
  :plugins [[lein-cljsbuild "LATEST"]]
  :cljsbuild {:builds
              {:dev {:source-paths ["cljs"]
                     :compiler {:output-to "resources/js/game.js"
                                :optimizations :whitespace
                                :pretty-print true}}
               :test {:source-paths ["test" "cljs"]
                     :compiler {:output-to "resources/js/test.js"
                                :optimizations :whitespace
                                :pretty-print true}}
               :production {:source-paths ["cljs"]
                            :compiler {:output-to "resources/js/game.min.js"
                                       :optimizations :advanced
                                       :pretty-print false}}}}
  :source-paths ["cljs"])
