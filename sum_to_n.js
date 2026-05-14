// 1. Gaussian formula — O(1)
const sum_to_n_a = (n) => (n * (n + 1)) / 2;

// 2. Iterative loop — O(n)
const sum_to_n_b = (n) => {
  let sum = 0;
  for (let i = 1; i <= n; i++) sum += i;
  return sum;
};

// 3. Recursive — O(n)
const sum_to_n_c = (n) => (n <= 1 ? n : n + sum_to_n_c(n - 1));