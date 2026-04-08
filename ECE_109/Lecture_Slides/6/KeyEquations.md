# Key Equations - Lecture 6

## Schrödinger Equation

**Time-dependent Schrödinger equation:**
$$i\hbar\frac{d}{dt}|\psi\rangle = \hat{H}|\psi\rangle$$

**Stationary states (eigenvalue equation):**
$$\hat{H}|\psi_n\rangle = E_n|\psi_n\rangle$$

**Time evolution of stationary state:**
$$|\psi_n(t)\rangle = e^{-i\frac{E_n}{\hbar}t}|\psi_n(t=0)\rangle$$

---

## Infinite Potential Well (1D)

**Energy levels:**
$$E_n = \frac{\hbar^2 n^2 \pi^2}{2m_e a^2} = \frac{h^2 n^2}{8m_e a^2}$$

**Energy difference:**
$$\Delta E_n = E_{n+1} - E_n = \frac{h^2(2n+1)}{8m_e a^2}$$

**Wavefunction:**
$$\Psi(x,t) = \frac{2}{a}\sin\left(\frac{n\pi x}{a}\right)e^{-j\omega t}$$

---

## Finite Potential Well

**Wavevector inside well:**
$$k = \frac{\sqrt{2m_e E}}{\hbar}$$

**Decay constant outside well:**
$$\alpha = \frac{\sqrt{2m_e(V_0 - E)}}{\hbar}$$

**Penetration depth:**
$$x_0 = \frac{1}{\alpha}$$

**Graphical condition:**
$$\alpha = k\tan\left(\frac{ka}{2}\right) \quad \text{(even parity)}$$
$$\alpha = -k\cot\left(\frac{ka}{2}\right) \quad \text{(odd parity)}$$

---

## Tunneling

**Transmission coefficient:**
$$T = \frac{1}{1 + D\sinh^2(\alpha a)}$$

**Parameter D:**
$$D = \frac{V_0^2}{4E(V_0 - E)}$$

**Reflection coefficient:**
$$R = 1 - T$$

---

## 3D Quantum Box

**Energy levels (rectangular):**
$$E_{n_1 n_2 n_3} = \frac{h^2}{8m_e}\left(\frac{n_1^2}{a^2} + \frac{n_2^2}{b^2} + \frac{n_3^2}{c^2}\right)$$

**Energy levels (cube, $a = b = c$):**
$$E_{n_1 n_2 n_3} = \frac{h^2}{8m_e a^2}(n_1^2 + n_2^2 + n_3^2)$$

**Wavefunction:**
$$\psi_{n_1 n_2 n_3}(x,y,z) = A\sin\left(\frac{n_1\pi x}{a}\right)\sin\left(\frac{n_2\pi y}{b}\right)\sin\left(\frac{n_3\pi z}{c}\right)$$

---

## Hydrogen Atom

**Coulomb potential:**
$$V(r) = -\frac{Ze^2}{4\pi\varepsilon_0 r}$$

**Wavefunction:**
$$\psi_{n,\ell,m_\ell}(r,\theta,\phi) = R_{n,\ell}(r) \cdot Y_{\ell,m_\ell}(\theta,\phi)$$

**Quantum numbers:**
- $n = 1, 2, 3, ...$
- $\ell = 0, 1, 2, ..., n-1$
- $m_\ell = -\ell, ..., +\ell$

**Selection rules:**
- $\Delta\ell = \pm 1$
- $\Delta m_\ell = 0, \pm 1$
