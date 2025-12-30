const QUESTIONS = {
  DSA: [
    {
      title: "Two Sum",
      description:
        "Given an array of integers and a target, return indices of two numbers that add up to the target.",
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      examples: [
        { input: "[2,7,11,15], 9", output: "[0,1]" },
      ],
      tests: [
        { input: [[2,7,11,15], 9], output: [0,1] },
      ],
    },
  ],

  LOGIC: [
    {
      title: "Reverse String",
      description: "Reverse the given string.",
      input: `"hello"`,
      output: `"olleh"`,
      examples: [{ input: `"abc"`, output: `"cba"` }],
      tests: [{ input: ["hello"], output: "olleh" }],
    },
  ],

  ALGO: [
    {
      title: "Max Element",
      description: "Find the maximum element in an array.",
      input: "[1, 5, 3]",
      output: "5",
      examples: [{ input: "[1,5,3]", output: "5" }],
      tests: [{ input: [[1,5,3]], output: 5 }],
    },
  ],

  PROBLEM: [
    {
      title: "FizzBuzz",
      description:
        "Print numbers from 1 to n. For multiples of 3 print Fizz, for 5 print Buzz.",
      input: "n = 5",
      output: "[1,2,'Fizz',4,'Buzz']",
      examples: [{ input: "5", output: "[1,2,'Fizz',4,'Buzz']" }],
      tests: [{ input: [5], output: [1,2,"Fizz",4,"Buzz"] }],
    },
  ],
};

export default async function getAIQuestion(category) {
  const list = QUESTIONS[category] || QUESTIONS.LOGIC;
  const question = list[Math.floor(Math.random() * list.length)];

  return {
    id: Date.now(),
    ...question,
  };
}
