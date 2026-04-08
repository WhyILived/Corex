# Test6: Knowledge Check
> Tests: Learn6 material (Hydrogen Atom Quantum States)
> Time: ~15 minutes

## Conceptual Questions

1. List and explain the three quantum numbers that characterize electron states in the hydrogen atom. What are their allowed ranges?

2. Why are the spherical harmonics $Y_{\ell,m_\ell}(\theta,\phi)$ important in describing the hydrogen atom wavefunction? What do they represent physically?

3. Why are there more possible states at higher energy levels (higher $n$)?

## Calculation Problems

1. For the 3p orbital ($n = 3$, $\ell = 1$), list all possible values of the magnetic quantum number $m_\ell$ and explain why the 3p orbital has a different shape than the 3s orbital.

2. The radial probability density for the 1s orbital is proportional to $r^2 e^{-2r/a_0}$ where $a_0 = 0.0529$ nm (Bohr radius). Find the value of $r$ that maximizes this probability (i.e., find the most probable radius for the 1s electron).

## Answers

1. For 3p orbital:
   - $n = 3$ (principal quantum number)
   - $\ell = 1$ (orbital angular momentum quantum number, meaning p-orbital)
   - $m_\ell = -1, 0, +1$ (three possible orientations in space)
   
   The $\ell$ quantum number determines the shape: $\ell = 0$ (s) has spherical symmetry, $\ell = 1$ (p) has dumbbell shape with a node at the origin.

2. To find maximum: take derivative of $r^2 e^{-2r/a_0}$ with respect to $r$ and set to zero.
   
   $\frac{d}{dr}(r^2 e^{-2r/a_0}) = 2r e^{-2r/a_0} - \frac{2r^2}{a_0}e^{-2r/a_0} = 0$
   
   $2r(1 - \frac{r}{a_0}) = 0$
   
   So $r = 0$ or $r = a_0$. The maximum at $r = 0$ is actually a minimum (the function goes to zero there). The maximum is at $r = a_0 = 0.0529$ nm.
   
   This is the Bohr radius—the most probable distance for finding the 1s electron.
