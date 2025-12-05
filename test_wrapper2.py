import sys
import collections
import collections.abc
collections.Container = collections.abc.Container
collections.Iterable = collections.abc.Iterable
collections.Iterator = collections.abc.Iterator
collections.Callable = collections.abc.Callable
collections.Mapping = collections.abc.Mapping
collections.MutableMapping = collections.abc.MutableMapping
collections.Sequence = collections.abc.Sequence
collections.MutableSequence = collections.abc.MutableSequence
collections.Set = collections.abc.Set
collections.MutableSet = collections.abc.MutableSet
collections.Hashable = collections.abc.Hashable
collections.Sized = collections.abc.Sized
sys.modules['collections'].Container = collections.abc.Container
sys.modules['collections'].Iterable = collections.abc.Iterable
sys.modules['collections'].Iterator = collections.abc.Iterator
sys.modules['collections'].Callable = collections.abc.Callable
sys.modules['collections'].Mapping = collections.abc.Mapping
sys.modules['collections'].MutableMapping = collections.abc.MutableMapping
sys.modules['collections'].Sequence = collections.abc.Sequence
sys.modules['collections'].MutableSequence = collections.abc.MutableSequence
sys.modules['collections'].Set = collections.abc.Set
sys.modules['collections'].MutableSet = collections.abc.MutableSet
sys.modules['collections'].Hashable = collections.abc.Hashable
sys.modules['collections'].Sized = collections.abc.Sized
exec(open(r'ml-contract-outputs/post_37085430_FIXED.py').read())
