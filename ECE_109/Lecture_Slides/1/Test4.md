# Test4: The Hydrogen Atom and Quantum Numbers
> Tests: Learn4 material
> Time: ~15 minutes

## Conceptual Questions

1. List the four quantum numbers needed to completely describe an electron in a hydrogen atom, and state what each one quantizes.

2. Why can an electron in a p state ($\ell = 1$) not have $m_\ell = 2$?

3. Explain the physical significance of the Bohr radius.

4. What are selection rules? Why does $\Delta \ell = 0$ transition not occur?

## Calculation Problems

1. **Energy Levels**
   - Calculate the energy (in eV) for hydrogen atoms in the $n = 1, 2, 3$ levels.
   - What is the ionization energy of hydrogen?
   - What wavelength photon is emitted when an electron transitions from $n = 3$ to $n = 1$?

2. **Angular Momentum**
   - For a 3p electron ($\ell = 1$), calculate:
     (a) The magnitude of orbital angular momentum $L$
     (b) The possible values of $L_z$
   - Given: $\hbar = 1.055 \times 10^{-34}$ J·s

3. **Quantum State Counting**
   - How many different quantum states exist for $n = 3$?
   - List all possible $(\ell, m_\ell)$ combinations for $n = 3$

4. **Transition Energy**
   - Calculate the frequency and wavelength of the photon emitted when an electron in hydrogen drops from $n = 4$ to $n = 2$.
   - Is this in the visible range? (Visible: ~400-700 nm)

## Answers

1. **Energy Levels:**
   - $E_1 = -13.6$ eV
   - $E_2 = -13.6/4 = -3.4$ eV
   - $E_3 = -13.6/9 = -1.51$ eV
   - Ionization energy = 13.6 eV
   - $\Delta E = E_3 - E_1 = -1.51 - (-13.6) = 12.09$ eV
   - $\lambda = hc/\Delta E = (1240 \text{ eV·nm})/12.09 \text{ eV} = 102.6$ nm (UV)

2. **Angular Momentum (3p, $\ell = 1$):**
   - $L = \hbar\sqrt{1(1+1)} = \hbar\sqrt{2} = 1.49 \times 10^{-34}$ J·s
   - $L_z$ can be: $m_\ell\hbar$ where $m_\ell = -1, 0, +1$
   - So $L_z = -\hbar, 0, +\hbar$

3. **Quantum States for $n = 3$:**
   - For $n = 3$: $\ell = 0, 1, 2$
   - $\ell = 0$: $m_\ell = 0$ → 1 state
   - $\ell = 1$: $m_\ell = -1, 0, +1$ → 3 states
   - $\ell = 2$: $m_\ell = -2, -1, 0, +1, +2$ → 5 states
   - With spin ($m_s = \pm 1/2$): Total = $2 \times (1+3+5) = 18$ states

4. **Transition $n = 4 \to n = 2$:**
   - $E_4 = -13.6/16 = -0.85$ eV
   - $E_2 = -3.4$ eV
   - $\Delta E = 2.55$ eV
   - $f = \Delta E/h = (2.55 \times 1.6 \times 10^{-19})/(6.63 \times 10^{-34}) = 6.16 \times 10^{14}$ Hz
   - $\lambda = hc/\Delta E = 1240/2.55 = 486$ nm (blue-green, visible)
