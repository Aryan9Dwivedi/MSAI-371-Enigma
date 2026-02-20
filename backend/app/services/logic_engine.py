"""
Minimal backward-chaining logic engine for FOPC-style inference.

Facts and rules are declarative; the engine performs unification and
resolution. No procedural encoding of rule logic — the engine interprets
rule structures generically.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Iterator


@dataclass(frozen=True)
class Var:
    """Logic variable for unification."""

    name: str

    def __repr__(self) -> str:
        return f"Var({self.name})"


@dataclass(frozen=True)
class Goal:
    """Base for goal expressions."""

    pass


@dataclass(frozen=True)
class FactGoal(Goal):
    """Goal: prove fact(predicate, *args). Args may contain Vars."""

    pred: str
    args: tuple[Any, ...]


@dataclass(frozen=True)
class ConjGoal(Goal):
    """Goal: prove all subgoals (AND)."""

    goals: tuple[Goal, ...]


@dataclass(frozen=True)
class NegGoal(Goal):
    """Goal: succeed if subgoal has no solutions (negation-as-failure)."""

    goal: Goal


@dataclass(frozen=True)
class ForallGoal(Goal):
    """Goal: forall X in domain, prove body(X)."""

    var: Var
    domain: Callable[["LogicEngine", dict[str, Any]], Iterator[Any]]
    body: Goal


@dataclass
class LogicEngine:
    """
    Logic engine with fact base and rule base.
    Inference is done via backward chaining; rules are declarative data.
    """

    facts: dict[str, set[tuple[Any, ...]]] = field(default_factory=dict)
    rules: list[tuple[str, list[str], Goal]] = field(default_factory=list)

    def assert_fact(self, pred: str, *args: Any) -> None:
        """Add ground fact."""
        if pred not in self.facts:
            self.facts[pred] = set()
        self.facts[pred].add(tuple(args))

    def add_rule(self, head_pred: str, head_var_names: list[str], body: Goal) -> None:
        """Add rule: head_pred(V1, V2, ...) :- body. Vars in body use these names."""
        self.rules.append((head_pred, head_var_names, body))

    def prove(self, goal: Goal, subst: dict[str, Any] | None = None) -> Iterator[dict[str, Any]]:
        """Backward-chaining proof. Yields substitutions satisfying the goal."""
        subst = subst or {}

        if isinstance(goal, FactGoal):
            yield from self._prove_fact(goal, subst)
        elif isinstance(goal, ConjGoal):
            yield from self._prove_conj(goal, subst)
        elif isinstance(goal, NegGoal):
            yield from self._prove_neg(goal, subst)
        elif isinstance(goal, ForallGoal):
            yield from self._prove_forall(goal, subst)

    def _prove_fact(
        self,
        goal: FactGoal,
        subst: dict[str, Any],
    ) -> Iterator[dict[str, Any]]:
        """Prove fact by fact-base lookup or rule application."""
        pred, args = goal.pred, goal.args

        # Try fact base
        if pred in self.facts:
            for fact in self.facts[pred]:
                if len(fact) != len(args):
                    continue
                new_subst = dict(subst)
                if self._unify(list(args), list(fact), new_subst):
                    yield new_subst

        # Try rules: bind head vars to goal args, prove body
        for rule_pred, var_names, body in self.rules:
            if rule_pred != pred or len(var_names) != len(args):
                continue
            rule_subst = {**subst, **dict(zip(var_names, args))}
            yield from self.prove(self._apply_subst(body, rule_subst), rule_subst)

    def _apply_subst(self, goal: Goal, subst: dict[str, Any]) -> Goal:
        """Replace Vars in goal with values from subst."""
        if isinstance(goal, FactGoal):
            new_args = tuple(
                subst[a.name] if isinstance(a, Var) and a.name in subst else a
                for a in goal.args
            )
            return FactGoal(goal.pred, new_args)
        if isinstance(goal, ConjGoal):
            return ConjGoal(tuple(self._apply_subst(g, subst) for g in goal.goals))
        if isinstance(goal, NegGoal):
            return NegGoal(self._apply_subst(goal.goal, subst))
        if isinstance(goal, ForallGoal):
            return ForallGoal(goal.var, goal.domain, self._apply_subst(goal.body, subst))
        return goal

    def _unify(
        self,
        pattern: list[Any],
        value: list[Any],
        subst: dict[str, Any],
    ) -> bool:
        """Unify pattern with value, updating subst. Returns True if successful."""
        if len(pattern) != len(value):
            return False
        for p, v in zip(pattern, value):
            if isinstance(p, Var):
                if p.name in subst:
                    if subst[p.name] != v:
                        return False
                else:
                    subst[p.name] = v
            elif p != v:
                return False
        return True

    def _prove_conj(
        self,
        goal: ConjGoal,
        subst: dict[str, Any],
    ) -> Iterator[dict[str, Any]]:
        """Prove conjunction: prove each subgoal, threading subst."""

        def prove_all(goals: list[Goal], s: dict[str, Any]) -> Iterator[dict[str, Any]]:
            if not goals:
                yield s
                return
            first, rest = goals[0], goals[1:]
            for s1 in self.prove(first, s):
                yield from prove_all(rest, {**s, **s1})

        yield from prove_all(list(goal.goals), subst)

    def _prove_neg(
        self,
        goal: NegGoal,
        subst: dict[str, Any],
    ) -> Iterator[dict[str, Any]]:
        """Negation-as-failure: succeed iff subgoal has no solutions."""
        if any(True for _ in self.prove(goal.goal, subst)):
            return
        yield subst

    def _prove_forall(
        self,
        goal: ForallGoal,
        subst: dict[str, Any],
    ) -> Iterator[dict[str, Any]]:
        """Prove forall X in domain: body(X)."""
        for x in goal.domain(self, subst):
            new_subst = {**subst, goal.var.name: x}
            if not any(True for _ in self.prove(goal.body, new_subst)):
                return
        yield subst
