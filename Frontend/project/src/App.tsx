import { useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import GameControls from "./GameComponents/gameControls";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
// import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
// import {
//   useEndGameMutation,
//   usePlayMoveMutation,
//   useStartGameMutation,
//   useUndoMoveMutation,
//   useVoiceToSanMutation,
// } from "./services/hooks";

function App() {
  const [showChessboard, setShowChessboard] = useState(false);
  const [game, setGame] = useState(new Chess());
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center mb-8"
      >
        <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
          Chess with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            BETH
          </span>
          {/* <Avatar className="h-16 w-16 border-2 border-purple-500 rounded-full">
            <AvatarImage
              src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJQAnwMBIgACEQEDEQH/xAAbAAABBQEBAAAAAAAAAAAAAAAEAAIDBQYBB//EADkQAAEDAgQEBAIJBAIDAAAAAAEAAgMEEQUSITEGQVFhEyIycSOhBxQzQlKBkbHBYnLh8CQ0FUNT/8QAGAEAAwEBAAAAAAAAAAAAAAAAAAECAwT/xAAhEQEBAAICAwADAQEAAAAAAAAAAQIRITEDEkEyUWGBE//aAAwDAQACEQMRAD8A0NR6UNT/AGiKn1aENT/aLFuJcmKR2yYlDKyflGVNT/upkispGubGwueQ0DqoaiVlPE6WQ2aPmsliWMzVEjg1xDBo0cm/7zU264ipjtqH4xS07xYlzuQsnN4tpS6zsg7grzmepe++pyu0y83/AOOy7CDmBl88h9LRoFN2v1j1qhxShrSGtqomOOweUdPTywi7hdh2cNl5fhtcG2EQe/L/APGIED83WH6L0nh/EPrcIglaRLls0yD1DpolL+05YccGOKhcjKqIayRfZ3sR+A9EG4q0mrrdwuLrfUEyF1H2H5LLzH4y01SfgfkspUutIfdEF6LG5B9ROqqOG2+JVSZtgEZjMn/Dt3Q/DIt4si0nTGtXL6AhoNJEVJsUJF9qobC3bJie7ZRpQHJ/K3VMCirqgU1JJKT6WmydNmeJcQL5zTxvs1umh59VmpJAXFgIt1/hdqahznvmOrv5P+hV7pcjTzPT+pRI06Gxua5xduG6DuV2WRrA90nob6u/ZBiTwsjBrqC4902W9SGw30fun6jZ7MeLJR4T7BuwZyW74S4yiZNHTVVpGSNJiePKWn8LhyPQrK0fD1KWDxGm6vcKwPD4qiOR7SQ07XRdFN/Wzg4hopMWBlfZkzQHjke/vsjKyAwSEXzNOrXdRyWV4zwOno8LZjFDHmYLZ4ydwDqr/hnEKXGOHGvpnOzRj0ndvYo6Tf3HbpzTqPdMK631BNIurPwT7LIVr/OVrq3SA+yxGIvDS4k7FEAXFZr0wHdTYORDhr3ncuCqaupE1Mcu190e54iwuGMHfUrWMa2LzoUK0/GRDzoUM37ZZNhROi4kTom3QZ42VJxbOYqDK06uV2Dosxxw60UN+V7/AKItE7YyscQ2w7XQsPlN3+rexREnnJUEUTp3OcLBoO56BOdKpl3PdmHVT4deSr9tk14A9Bvfc9fZCsrJKKQPjflANi5zDlJ90+yt9W2icWiyKjmc21is9QYjNUPyyBu1xlU9fWzUwyxhue33uSj1Xvjb0Ik1vCFbFI9pdGwkAG+hCyH0T1ckUk8ea7XAaE6E2ss9SY/IJXCpqZXDKR5RZqv/AKMGNEjCR6nDf2RnxinHnbdute457pNPmb7pSgteQdxpomM9bfdHxA7EP+u72Xn+KuJEllv8Q/6zv7V5/iXqd7pwlC9xZTOb3Rk1ZEaeNmcXaAgMSeI48nNyqXOK0nTOx7G7ZDj7YKdx0KFB+OFk2FlcKS4UA/OxgzPIA991l+O2f8GkkLgTI7YHlqhOIMVlhxTTM5kIAAaP1VFjeMPrzCHXyg63CXO1ySQHUPyQuI9TguiZlNA2JrQS0DM5210JWyjNpsCEPWykHTYi600n2EOnkqZMkXPd2xVlFg7ZoI4pgC1huLKswghlVZ25AWvgcMosAleDk9uQ9BRx01VEAPK0WPdW+OYLnENR4eVsjbtNrXsVVGshp6i8+bfQBpOi0bMdgxLBWwEPE1PNmh09TCPMP1AKmn/FNTYMwx1dRLE0PMJAceVgSLIf6PJyJIoxo7ykInGsSFFg9TIDZ8jTHGOpdp/lUvB8hp8Qp/wnyn5JZc4njNV6xPYuzN2dr+aij+0aO6lqW5XAdRdRU+tQz3RLwi9rCubend7Lz7FRke4HqvSKtvwj7Ly7i+pZA57I3gv59lWLP4y+K1LZqwNYdGiyHIuhGPzzXO5KLB1WqY9gKG/94U90MT8cLFqKuk4mxskVwnTRAeaY1NURVL46lj45Wkj+7XdUc0kjnh0jvKdbdl6jxHhIxSgd4YtUR+aMjmei82q2yQ0zWSRmOdzrOa5urQFWJg3EvBvuUwgyAX3AsiWQ2e1rCHknWy7FEGzNbb1EhVtLjbxVUZ5aBaWlqWxsu4OPsLrPVrS19hu2ys8Lqg4ZZDr0SqpdUdPidO7Q000o5kM2/lWeEYxQinEEsM0RBs0yM0cO3RVE9HnOZs2Q9kHilWMIoyRIJKiUWYCfmeymTdVbJEHE9YKvFW08bvgwG5Hc/wA2/dH4NG5lTTO287LrK4Pmqa6zzme83JPVei4LQ+LV0zLaZ23Hsl5OOC8d3y9BrR8OBwNwW2J+f7EIek1qmDuuy1QqKYENDXRvLHAc7bH9EyhN6tnulj0nJBx7xAMEw/LHrPKCGWXitTW1FVM+ad5dmNyV6D9LEb5MUpvEBEWQhp6lYl9MHRWj1C1w4ZWK2nIMpPJGN90FHA6CUh3M6Itq0qY9hJ0Q7z8ZTE6IeTSYLnbjL7JpKV9AuEoB7XWFzyXnXFEMsuKyTu+87RzPu9lv55BFCXG3seaw+LT03iyEyhjybgZtk52cUTZoomkZmFx3sLFSRNEYE0riAdghKkNEgnjLXgHWw2TJ5HykXcbcu6vRb0jq53SsllBsbaFVZrKk2+M4W2toiq2UCLI1AALTGcMc8t3gc3GK4NDTLe3UISeWWeQvmkL3HmU0BdsnqIuVFYPUCkr4pXDytcLr1bCMVo2yRTRXNyCbDZeQZb6X0Vnh1VJDlaZ5mxX1ax1i5Rn4/deHl9HuU88Mry6nc05zmNtiSBdAjG6HDaxpqp2ty7hYDCccbTOZ4FILX1MsjnF3uTf9lp6jCsM4ohPiMFJVvGk0Dr3PdpGqU8Wh/wBdqz6QeLMLxmSCOicXOjOruSpsCpDX1TYySI/vELYx/Rdg9NB40s8s5y38x2WNqG1WDYlL9R0pjcDMUuOocv2tZWcL4disHg0do6hn37rLV/DGJYaCWxtnF7ZmFXOC4lI2kY+OTz3JcQfkhMUxSamrWTQvcGyA5mE+W6mWzhvccbNtsoXayBS3TW5b3KlKe2gTSEhMPYKKtqW09OX3FzpZI4qsdrAyNwvoAvPagfWqqR5PlBtZX2MVwdnL3WbdZGSsf8TIcrNSLc1thEeTKRJLN4Mjo2AWtY3UUsznNaLWyiwUGucX3XSblaaYXKoZhctvzC4ApH6uXAE0m5Urap5C5vqUEQ30UrNUy17DqnFwAudkAVHIb+U7bkK/wDFX087W5yW3ssw3zanyt/D1RVJJllaWjQHRBvcHYu//AMK05c8j7tH6LznFcIqKqUumn0Lr5WrQQ4iKXhV08kbntZI3Rtri+iqBj1FUby5L8pBZc+czmXDo8fpceVVFAcN0gc4tvq0rlQw4pMwPJaxgOytX/V6lpySRuv8AhcFXua6mkNyW/klN/Wvz+NjHJI2cxm9uqnfTuzXY9yeGtvfmn5tEkK3Ep5KGinqHkEMYTr15fNUEWOU1dSwtdM0StYA9rzrm5p/0gYiI6WKgYfNIc7/YbD8z+y89kHe/da44bxZ3yeuS8x2rZIWsieHAbgFUTz5XDrZJoGUnumHW61k1GWV3dpfvXTwmDdSAISYRqu2su2XQOSAadvdIDYLv3iuOJDSUBxoLttkhfPceY/IJWLvK2+qkAEYyjdBk0WNzqUZQRl84tsNSEINSrPDWfEY1urnnXsEBtJnil4RneW6Zmut01t/KzLMSh1bNG3+oOZqFsKmFk2BVFHJYeJSuyi/Ma/wsKaGUMe0zSWJBfcZg4jZTlr6vC3Qtww2d4c1nhkD7hsiGUUJA8HEJGj+66qJKaV13FsJzvDi4DK6w5C2yilEzGOyRSteX+WzrgN6KNL/x6tmXDK1oLnOAa0XJ6BYWn4mq4rXbnaByXcZ4kNbhToGMdG95Ace3NR6XaveaUWPYg7EsSnqSfK5xDBfZo2VW8qR5uonronTnt5NJsE0G5S1ukPUEBO1P5JrU4IIgnLgCRTDiZL6mt6lSjdQjzSXPJIHRGzOd72UgGXuUmgNGmp/ZJxy+nVyDd9PTVW+AML6sOIvy0VO3utDw0wfWGOy/n7IDQYzKTO6EOLWx00rnFmulrfx81nWPkHhyB7HxO1jpw4EuPLTrzKvnvbK/EWtDnTOj8O+nlG3z1VCaOpabGNzC5+UB7Nm9SRsozaePejpKyqYS+qia+UaBjhYW9k1k7S/w2RnxTrfYDsmQiZjs8Bc10zzGDG+5fbsVHJO8RMYXBgDiC/wwHEjuoabco2gQZuZKCxE/GLeWUJJLSfkyy/GAXKJ26SSpmZ17LgPxB72SSQYkLo2SSQRwTkkkAjoCoYxuUkkGmecrQRuU1osupIBwWm4WYDIwnfMupIA3CHmSlqpnW8R9QATbcXJVfHjVWyqdF8NwDyLluq6kss/yb4fivvDiqKdsk0Mbnb3y7IeXC6aPwzHnYGElrQ7QX30SSWdayP/Z"
              alt="BETH AI"
              className="rounded-full object-cover"
            />
            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl">
              B
            </AvatarFallback>
          </Avatar> */}
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Your AI-powered chess companion with voice controls
        </p>

        {!showChessboard && (
          <Button
            onClick={() => setShowChessboard(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 rounded-lg text-lg font-semibold transition-all duration-200 hover:scale-105"
          >
            Start Playing
          </Button>
        )}
      </motion.div>

      <AnimatePresence>
        {showChessboard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-7xl"
          >
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[600px] rounded-lg border border-gray-700"
            >
              <ResizablePanel defaultSize={70} minSize={50}>
                <Card className="h-full bg-gray-800/50 backdrop-blur-sm border-gray-700">
                  <div className="flex items-center justify-center h-full p-6">
                    <Chessboard
                      position={game.fen()}
                      boardWidth={600}
                      customBoardStyle={{
                        borderRadius: "8px",
                        boxShadow: "0 8px 16px -4px rgba(0, 0, 0, 0.2)",
                      }}
                      customDarkSquareStyle={{ backgroundColor: "#8363aa" }}
                      customLightSquareStyle={{ backgroundColor: "#EDE7F6" }}
                      arePremovesAllowed={true}
                    />
                  </div>
                </Card>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={30} minSize={20}>
                <Card className="h-full bg-gray-800/50 backdrop-blur-sm border-gray-700">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold  text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 ">
                      Game Controls
                    </h2>
                    <div>
                      <GameControls
                        setGameStarted={setGameStarted}
                        gameStarted={gameStarted}
                      />
                    </div>
                  </div>
                </Card>
              </ResizablePanel>
            </ResizablePanelGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default App;
