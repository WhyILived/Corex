# Test2: Electron in an Infinite Potential Well
> Tests: Learn2 material
> Time: ~15 minutes

## Conceptual Questions

1. Why does the infinite potential well lead to quantized (discrete) energy levels?

2. What is the physical meaning of the quantum number $n$?

3. Why is $n=0$ excluded (no solution with $n=0$)?

4. Compare the wavefunctions for $n=1$ and $n=2$ inside the infinite well. How many nodes does each have?

5. What is the parity of $\psi_3(x)$ about the center of the well at $x = a/2$?

## Calculation Problems

1. **Energy calculation for atomic-scale well**
   
   An electron is confined in an infinite potential well of width $a = 0.1$ nm (typical atomic size).
   - Calculate the ground state energy $E_1$ in eV.
   - Calculate the energy required to excite the electron from $n=1$ to $n=2$.

2. **Wavefunction normalization**
   
   Verify that $\psi_n(x) = \sqrt{\frac{2}{a}} \sin\left(\frac{n\pi x}{a}\right)$ is properly normalized:
   $$\int_0^a |\psi_n(x)|^2 dx = 1$$

3. **Probability calculation**
   
   For an electron in the ground state ($n=1$) in a well of width $a$:
   - What is the probability of finding the electron in the region $0 < x < a/2$?
   - Explain this result based on the symmetry of $\psi_1$.

## Answers

1. **Energy quantization**: The boundary condition $\psi(a) = 0$ requires $\sin(ka) = 0$, which means $ka = n\pi$ for integer $n$. Since $k$ is directly related to energy by $E = \hbar^2 k^2/2m_e$, only discrete $k$ values give discrete $E$ values.

2. The quantum number $n$ determines the number of half-wavelengths that fit in the well: $n\pi = ka = 2\pi a/\lambda$, so $\lambda = 2a/n$. Higher $n$ means shorter wavelength and higher kinetic energy.

3. If $n=0$, then $k_0 = 0$ and $\psi(x) = \sqrt{2/a} \sin(0) = 0$ everywhere. This means no electron exists in the well.

4. $\psi_1(x) = \sqrt{2/a}\sin(\pi x/a)$ has **no nodes** inside the well (only zeros at boundaries). $\psi_2(x) = \sqrt{2/a}\sin(2\pi x/a)$ has **one node** at $x = a/2$ inside the well.

5. $\psi_3(x) = \sqrt{2/a}\sin(3\pi x/a)$ is an **odd** function about $x = a/2$ because $\sin(3\pi(a/2 + x)/a) = \sin(3\pi/2 + 3\pi x/a) = -\sin(3\pi/2 - 3\pi x/a) = -\psi_3(a/2 - x)$. So it has odd parity.

## Calculation Problem Answers

1. **Energy calculation:**
   
   $E_n = \frac{h^2 n^2}{8m_e a^2}$
   
   $E_1 = \frac{(6.63 \times 10^{-34})^2 (1)^2}{8(9.11 \times 10^{-31})(0.1 \times 10^{-9})^2} = \frac{4.40 \times 10^{-67}}{7.29 \times 10^{-49}} = 6.03 \times 10^{-18}$ J
   
   $E_1 = \frac{6.03 \times 10^{-18}}{1.6 \times 10^{-19}}$ eV $= 37.7$ eV
   
   $E_2 = \frac{h^2 (2)^2}{8m_e a^2} = 4E_1 = 150.8$ eV
   
   $\Delta E = E_2 - E_1 = 150.8 - 37.7 = 113.1$ eV

2. **Normalization verification:**
   
   $\int_0^a |\psi_n|^2 dx = \int_0^a \frac{2}{a} \sin^2\left(\frac{n\pi x}{a}\right) dx$
   
   $= \frac{2}{a} \int_0^a \frac{1 - \cos(2n\pi x/a)}{2} dx = \frac{1}{a} \left[x - \frac{a}{2n\pi}\sin\frac{2n\pi x}{a}\right]_0^a$
   
   $= \frac{1}{a}(a - 0 - 0 + 0) = 1$ ✓

3. **Probability in left half:**
   
   $P(0 < x < a/2) = \int_0^{a/2} |\psi_1|^2 dx = \int_0^{a/2} \frac{2}{a} \sin^2\left(\frac{\pi x}{a}\right) dx$
   
   Let $u = \pi x/a$, $dx = a/\pi du$:
   
   $= \frac{2}{a} \cdot \frac{a}{\pi} \int_0^{\pi/2} \sin^2 u \, du = \frac{2}{\pi} \cdot \frac{\pi}{4} = \frac{1}{2}$
   
   The probability is 1/2. This makes sense because $\psi_1$ is symmetric about $x = a/2$, so the electron is equally likely to be found in either half of the well.