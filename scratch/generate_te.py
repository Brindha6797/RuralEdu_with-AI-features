import os
import re

file_path = r"c:\Users\ADMIN\ruraledu_app\frontend\src\context\translations.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Tamil brand name from "ஊரகம் கல்வி(Ooragam Kalvi)" to "ஊரகம் (Ooragam)"
content = content.replace("ஊரகம் கல்வி(Ooragam Kalvi)", "ஊரகம் (Ooragam)")

# 2. Parse out the "en" block to clone for "te"
# We know "en" starts with: "en": { and ends with: },
# Let's find "en": { ... }, using a bracket matching regex or logic.
en_match = re.search(r'"en":\s*\{', content)
if en_match:
    start_idx = en_match.start()
    # Find matching closing brace for "en" block
    brace_count = 0
    end_idx = -1
    for i in range(start_idx, len(content)):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = i
                break
                
    if end_idx != -1:
        en_block_text = content[start_idx:end_idx+1]
        
        # Clone for "te" and replace brand names
        te_block_text = en_block_text.replace('"en":', '"te":')
        te_block_text = te_block_text.replace("RuralEdu", "గ్రామ విద్య (Grāma Vidya)")
        
        # Find where to insert "te" block.
        # The file ends with:
        #   }
        # };
        # Let's insert the "te" block before the final closing brace.
        # We search for the last "}," before the final closing brace.
        # Let's find the last occurrence of "}" before the end of the file.
        last_brace_idx = content.rfind("}")
        # Find the brace before that
        second_last_brace_idx = content.rfind("}", 0, last_brace_idx)
        
        # We can format it:
        # after the "hi" block ends (second_last_brace_idx + 1), insert a comma and the te_block_text
        insert_idx = second_last_brace_idx + 1
        
        new_content = content[:insert_idx] + ",\n  " + te_block_text + content[insert_idx:]
        
        with open(file_path, "w", encoding="utf-8") as f_out:
            f_out.write(new_content)
        print("Successfully updated translations.js with Telugu and Tamil brand names!")
    else:
        print("Could not find end of 'en' block.")
else:
    print("Could not find 'en' block.")
