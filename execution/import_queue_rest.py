#!/usr/bin/env python3
import os
import json
import urllib.request
import urllib.error

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUEUE_PATH = os.path.join(PROJECT_ROOT, 'social', 'bervos_social_queue.json')
CLI_CONFIG_PATH = os.path.expanduser('~/.config/configstore/firebase-tools.json')

def get_access_token():
    if not os.path.exists(CLI_CONFIG_PATH):
        raise FileNotFoundError(f"Firebase CLI config not found at: {CLI_CONFIG_PATH}")
    
    with open(CLI_CONFIG_PATH, 'r', encoding='utf-8') as f:
        config = json.load(f)
        
    access_token = config.get('tokens', {}).get('access_token')
    if not access_token:
        raise ValueError("No active access token found in firebase-tools.json. Please run 'firebase login'.")
    return access_token

def to_firestore_value(val):
    if val is None:
        return {"nullValue": None}
    elif isinstance(val, bool):
        return {"booleanValue": val}
    elif isinstance(val, (int, float)):
        return {"doubleValue": val}
    elif isinstance(val, str):
        return {"stringValue": val}
    elif isinstance(val, list):
        return {"arrayValue": {"values": [to_firestore_value(v) for v in val]}}
    elif isinstance(val, dict):
        return {"mapValue": {"fields": {k: to_firestore_value(v) for k, v in val.items()}}}
    return {"stringValue": str(val)}

def parse_firestore_value(f_val):
    if "nullValue" in f_val:
        return None
    elif "booleanValue" in f_val:
        return f_val["booleanValue"]
    elif "doubleValue" in f_val:
        return f_val["doubleValue"]
    elif "integerValue" in f_val:
        return int(f_val["integerValue"])
    elif "stringValue" in f_val:
        return f_val["stringValue"]
    elif "arrayValue" in f_val:
        return [parse_firestore_value(v) for v in f_val["arrayValue"].get("values", [])]
    elif "mapValue" in f_val:
        return {k: parse_firestore_value(v) for k, v in f_val["mapValue"].get("fields", {}).items()}
    return None

def main():
    print("Reading Firebase Auth Token from CLI config...")
    try:
        token = get_access_token()
    except Exception as e:
        print(f"[Error] Failed to get auth token: {e}")
        return
        
    if not os.path.exists(QUEUE_PATH):
        print(f"[Error] Social queue file not found at: {QUEUE_PATH}")
        return
        
    with open(QUEUE_PATH, 'r', encoding='utf-8') as f:
        posts = json.load(f)
        
    print(f"Syncing {len(posts)} posts to Firestore via REST API (checking protection)...")
    
    updated_local_posts = []
    
    for post in posts:
        post_id = post.get('id')
        if not post_id:
            continue
            
        url = f"https://firestore.googleapis.com/v1/projects/bervos-official/databases/(default)/documents/social_posts/{post_id}"
        
        # 1. Fetch current document from Firestore if it exists
        req_get = urllib.request.Request(
            url,
            headers={'Authorization': f'Bearer {token}'},
            method='GET'
        )
        
        existing_doc = None
        try:
            with urllib.request.urlopen(req_get) as res:
                existing_doc = json.loads(res.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code != 404:
                print(f"  [Warning] Failed to fetch status for {post_id}: {e.code}")
        except Exception as e:
            print(f"  [Warning] Failed to fetch status for {post_id}: {e}")
            
        if existing_doc:
            fields = existing_doc.get('fields', {})
            existing_status = fields.get('status', {}).get('stringValue', 'Draft')
            
            # If the post is already Approved, Scheduled, or Published in Firestore, do NOT overwrite it
            if existing_status in ['Approved', 'Scheduled', 'Published']:
                print(f"  [Protected] {post_id} is in '{existing_status}' status in Firestore. Skipping sync.")
                # Sync the local queue object to match the Firestore data (keeping statuses in sync)
                synced_post = {}
                for k, v in fields.items():
                    synced_post[k] = parse_firestore_value(v)
                # Keep ID if it parsed differently
                synced_post['id'] = post_id
                updated_local_posts.append(synced_post)
                continue
                
        # 2. Overwrite or Create document in Firestore
        fields = {k: to_firestore_value(v) for k, v in post.items()}
        body = {"fields": fields}
        
        req_patch = urllib.request.Request(
            url,
            data=json.dumps(body).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}'
            },
            method='PATCH'
        )
        
        try:
            with urllib.request.urlopen(req_patch) as res:
                print(f"  Successfully synced: {post_id}")
                updated_local_posts.append(post)
        except urllib.error.HTTPError as e:
            print(f"  [Error] Failed to sync {post_id}: {e.code} - {e.read().decode('utf-8')}")
            updated_local_posts.append(post)
        except Exception as e:
            print(f"  [Error] Failed to sync {post_id}: {e}")
            updated_local_posts.append(post)

    # Save the updated queue file (keeping statuses in sync with Firestore)
    try:
        with open(QUEUE_PATH, 'w', encoding='utf-8') as f:
            json.dump(updated_local_posts, f, indent=2, ensure_ascii=False)
        print("Successfully updated local queue JSON to match Firestore state.")
    except Exception as e:
        print(f"[Warning] Failed to update local queue file: {e}")

if __name__ == '__main__':
    main()
