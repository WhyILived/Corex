# Learn1: Schrödinger Equation and Stationary States
> Estimated time: ~30 minutes

## The Time-Dependent Schrödinger Equation

The fundamental equation describing how quantum states evolve in time is:

$$i\hbar\frac{d}{dt}|\psi\rangle = \hat{H}|\psi\rangle$$

Where:
- $i$ = imaginary unit
- $\hbar$ = reduced Planck's constant ($1.055 \times 10^{-34}$ J·s)
- $|\psi\rangle$ = quantum state vector
- $\hat{H}$ = Hamiltonian operator (total energy operator)

## Stationary States

Stationary states are eigenstates of the Hamiltonian where:

$$\hat{H}|\psi_n\rangle = E_n|\psi_n\rangle$$

Why "stationary"? The time evolution of a stationary state is:

$$|\psi_n(t)\rangle = e^{-i\frac{E_n}{\hbar}t}|\psi_n(t=0)\rangle$$

The probability density remains constant:

$$|\psi_n(t)\rangle|^2 = |\psi_n(t=0)\rangle|^2$$

## General Solutions

Any solution to the Schrödinger equation can be expressed as a superposition of stationary states:

$$|\psi(t=0)\rangle = \sum_n c_n|\psi_n(t=0)\rangle$$

Where the coefficients are:

$$c_n = \langle\psi_n(t=0)|\psi(t=0)\rangle = \int_{-\infty}^{+\infty}\psi_n^*(x)\psi(x)dx$$

The time evolution then follows:

$$|\psi(t)\rangle = \sum_n c_n e^{-i\frac{E_n}{\hbar}t}|\psi_n(0)\rangle$$
