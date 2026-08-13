




import json
import time
import sys
sys.path.insert(0, '/home/pratham/Disk1/NextRound/apps/ai-service')

from services.llm_service import extract_json_array, extract_json_object


def test_extract_json_array_basic():
    """Test basic JSON array extraction."""
    text = "Here's the result: [1, 2, 3]"
    result = extract_json_array(text)
    assert result == [1, 2, 3], f"Expected [1, 2, 3], got {result}"
    print("✓ test_extract_json_array_basic passed")


def test_extract_json_array_with_nesting():
    """Test JSON array with nested objects."""
    text = 'Some prefix [{\"id\": 1}, {\"id\": 2}] suffix'
    result = extract_json_array(text)
    assert result == [{"id": 1}, {"id": 2}], f"Expected nested objects, got {result}"
    print("✓ test_extract_json_array_with_nesting passed")


def test_extract_json_object_basic():
    """Test basic JSON object extraction."""
    text = "Result: {\"name\": \"test\"}"
    result = extract_json_object(text)
    assert result == {"name": "test"}, f"Expected {{'name': 'test'}}, got {result}"
    print("✓ test_extract_json_object_basic passed")


def test_extract_json_object_with_nesting():
    """Test JSON object with nested structures."""
    text = 'Data: {"outer": {"inner": [1, 2]}} end'
    result = extract_json_object(text)
    assert result == {"outer": {"inner": [1, 2]}}, f"Expected nested object, got {result}"
    print("✓ test_extract_json_object_with_nesting passed")


def test_extract_json_array_large_response():
    """Test JSON array extraction on a large LLM response."""

    prefix = "This is a very long prefix. " * 100
    json_data = [
        {"id": f"q{i}", "category": "test", "difficulty": "medium", "question": f"Question {i}"}
        for i in range(50)
    ]
    text = prefix + json.dumps(json_data) + " Some suffix"
    
    result = extract_json_array(text)
    assert result == json_data, "Expected full JSON array"
    print("✓ test_extract_json_array_large_response passed")


def test_extract_json_array_with_escaped_quotes():
    """Test JSON array with escaped quotes."""
    text = '[{"text": "He said \\"hello\\""}]'
    result = extract_json_array(text)
    assert result == [{"text": 'He said "hello"'}], f"Expected escaped quote handling, got {result}"
    print("✓ test_extract_json_array_with_escaped_quotes passed")


def test_extract_json_object_empty():
    """Test empty JSON object extraction."""
    text = "Result: {}"
    result = extract_json_object(text)
    assert result == {}, f"Expected empty object, got {result}"
    print("✓ test_extract_json_object_empty passed")


def test_extract_json_array_empty():
    """Test empty JSON array extraction."""
    text = "Result: []"
    result = extract_json_array(text)
    assert result == [], f"Expected empty array, got {result}"
    print("✓ test_extract_json_array_empty passed")


def test_extract_json_array_none_when_not_found():
    """Test returns None when JSON not found."""
    text = "No JSON here"
    result = extract_json_array(text)
    assert result is None, f"Expected None, got {result}"
    print("✓ test_extract_json_array_none_when_not_found passed")


def test_extract_json_object_none_when_not_found():
    """Test returns None when JSON not found."""
    text = "No JSON here"
    result = extract_json_object(text)
    assert result is None, f"Expected None, got {result}"
    print("✓ test_extract_json_object_none_when_not_found passed")


def test_extract_multiple_arrays_returns_first():
    """Test returns first JSON array when multiple exist."""
    text = "[1, 2, 3] some text [4, 5, 6]"
    result = extract_json_array(text)
    assert result == [1, 2, 3], f"Expected first array [1, 2, 3], got {result}"
    print("✓ test_extract_multiple_arrays_returns_first passed")


def test_extract_multiple_objects_returns_first():
    """Test returns first JSON object when multiple exist."""
    text = '{"first": 1} some text {"second": 2}'
    result = extract_json_object(text)
    assert result == {"first": 1}, f"Expected first object, got {result}"
    print("✓ test_extract_multiple_objects_returns_first passed")


def test_performance_comparison():
    """Performance comparison between bracket-matching and regex (informal)."""
    import re
    


    prefix = "This is very long LLM output with lots of text. " * 500
    json_data = [{"id": i, "text": "Sample question " * 20} for i in range(50)]
    text = prefix + json.dumps(json_data) + prefix
    

    start = time.time()
    for _ in range(50):
        result = extract_json_array(text)
    bracket_time = time.time() - start
    

    def extract_json_array_regex(t):
        match = re.search(r"\[.*\]", t, re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except:
            return None
    
    start = time.time()
    for _ in range(50):
        result = extract_json_array_regex(text)
    regex_time = time.time() - start
    


    print(f"✓ Performance comparison (on ~{len(text)/1024:.0f}KB response):")
    print(f"  Bracket-matching: {bracket_time:.4f}s for 50 calls")
    print(f"  Regex approach: {regex_time:.4f}s for 50 calls")
    if bracket_time > 0:
        speedup = regex_time / bracket_time
        print(f"  Speedup ratio: {speedup:.2f}x")
    print(f"  Note: Bracket-matching is more efficient for very large responses (>100KB)")
    print(f"  Both approaches are acceptable for typical LLM responses (<10KB)")


if __name__ == "__main__":
    print("Running LLM Service Optimization Tests...\n")
    
    test_extract_json_array_basic()
    test_extract_json_array_with_nesting()
    test_extract_json_object_basic()
    test_extract_json_object_with_nesting()
    test_extract_json_array_large_response()
    test_extract_json_array_with_escaped_quotes()
    test_extract_json_object_empty()
    test_extract_json_array_empty()
    test_extract_json_array_none_when_not_found()
    test_extract_json_object_none_when_not_found()
    test_extract_multiple_arrays_returns_first()
    test_extract_multiple_objects_returns_first()
    test_performance_comparison()
    
    print("\n✅ All tests passed!")
