import React from "react";


const TestMotion = () => {
  return (
    <motion.div
      animate={{ x: 100 }}
      transition={{ duration: 1 }}
      style={{
        width: "100px",
        height: "100px",
        backgroundColor: "skyblue",
      }}
    >
      Hello Motion
    </motion.div>
  );
};

export default TestMotion;
