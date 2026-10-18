#!/usr/bin/env python3
"""
Generate the SQL that loads the legacy TIKKIT data export into the new schema.

Usage:  python3 scripts/import_legacy.py <backup_dir> <out_dir>
  backup_dir  folder created by the pre-migration export (tables/*.json, auth_users.json)
  out_dir     where import.sql and storage_map.json are written (contains personal data; keep private)

Run the result with:  supabase db query --linked -f <out_dir>/import.sql
Then copy files:      node scripts/copy_legacy_storage.mjs <out_dir>/storage_map.json

What is imported: profiles, private data, organizer profiles, attendee scores, events (with secrets),
ticket types, payment accounts, registrations (legacy public_registrations and guests merged), payment
proofs, scan logs, vendor contacts and invoices. Each organizer gets a fresh 14 day trial.
Not imported: chats, behaviour data, support tables, artists, management, waitlists, notifications.
"""
import json
import re
import sys
import uuid
from pathlib import Path

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
ZERO = '00000000-0000-0000-0000-000000000000'


def load(name):
    p = SRC / 'tables' / f'{name}.json'
    return json.loads(p.read_text()) if p.exists() else []


def q(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def arr(items, typ):
    if items is None:
        return 'null'
    return "array[" + ",".join(q(i) for i in items) + f"]::{typ}[]" if items else f"'{{}}'::{typ}[]"


def ts(v):
    return q(v) + '::timestamptz' if v else 'null'


def enum_or_null(v, allowed):
    return q(v) if v in allowed else 'null'


def pkr(v):
    return 0 if v is None else int(round(float(v)))


profiles = load('profiles')
guest_profiles = {g['id']: g for g in load('guest_profiles')}
auth_users = {u['id']: u for u in json.loads((SRC / 'auth_users.json').read_text())}
events = load('events')
ticket_types = load('ticket_types')
pay_accounts = load('payment_accounts')
event_pay = load('event_payment_accounts')
pub_regs = load('public_registrations')
guests = load('guests')
scan_logs = load('scan_logs')
vendors = load('organiser_vendor_contacts')
invoices = load('organiser_vendor_invoices')

event_ids = {e['id'] for e in events}
tt_by_id = {t['id']: t for t in ticket_types}
sql = []
storage_map = []

sql.append('begin;')
sql.append('set local session_replication_role = replica;  -- explicit inserts below replace the triggers')

# ---------------------------------------------------------------- identity
ROLE = {'organizer': 'organizer', 'guest': 'attendee', 'admin': 'admin'}
seen = set()
attendee_ids_by_email = {}
organizer_ids = []
pv_rows, pr_rows, op_rows, st_rows = [], [], [], []

def add_profile(uid, role, p, gp, au):
    email = (p or {}).get('email') or au.get('email') or ''
    name = (p or {}).get('full_name') or (gp or {}).get('username') or (email.split('@')[0] if email else 'Member')
    username = (p or {}).get('username') or None
    if username and not re.match(r'^[a-z0-9_-]{3,30}$', username):
        username = None
    city = (p or {}).get('city') or (gp or {}).get('city')
    avatar = (p or {}).get('avatar_url') or (gp or {}).get('avatar_url')
    created = (p or {}).get('created_at') or au.get('created_at')
    pr_rows.append(f"({q(uid)}, {q(role)}, {q(name)}, {q(username)}, {q(avatar)}, {q(city)}, 'PK', 'dark', {ts(created)})")

    gender = (gp or {}).get('gender')
    dob = (gp or {}).get('date_of_birth')
    cnic = (p or {}).get('cnic_number')
    image = (p or {}).get('cnic_image_url')
    new_image = None
    if image:
        legacy_path = re.sub(r'^.*?/cnic-documents/', '', image.split('?')[0])
        new_image = f"{uid}/{Path(legacy_path).name}"
        storage_map.append({'from_bucket': 'cnic-documents', 'from_path': legacy_path, 'to_bucket': 'id-documents', 'to_path': new_image})
    status = (p or {}).get('cnic_status') or 'none'
    if status not in ('none', 'pending', 'verified', 'rejected'):
        status = 'none'
    pv_rows.append(
        f"({q(uid)}, {q(email)}, {q((p or {}).get('phone_number') or au.get('phone'))}, {q(dob)}, "
        f"{enum_or_null(gender, ('male', 'female', 'other'))}, {q('cnic') if cnic else 'null'}, {q(cnic)}, {q(new_image)}, "
        f"{q((p or {}).get('cnic_expiry'))}, {q(status)}, {ts((p or {}).get('cnic_submitted_at'))}, {q((p or {}).get('cnic_reject_reason'))})"
    )
    if role == 'organizer':
        organizer_ids.append(uid)
        op_rows.append(f"({q(uid)}, {q((p or {}).get('company_name'))}, {q((p or {}).get('logo_url'))}, {q((p or {}).get('cover_image_url'))})")
    elif role == 'attendee':
        attendee_ids_by_email[email.lower()] = uid
        st_rows.append(
            f"({q(uid)}, {int((gp or {}).get('credit_score') or 0)}, {int((gp or {}).get('total_attended') or 0)}, "
            f"{int((gp or {}).get('total_no_shows') or 0)}, {int((gp or {}).get('total_vip_events') or 0)}, "
            f"{int((gp or {}).get('attendance_streak') or 0)}, {int((gp or {}).get('longest_streak') or 0)})"
        )

for p in profiles:
    uid = p['id']
    if uid not in auth_users:
        continue  # no login to attach to
    seen.add(uid)
    add_profile(uid, ROLE.get(p.get('role'), 'attendee'), p, guest_profiles.get(uid), auth_users[uid])
for uid, au in auth_users.items():
    if uid not in seen:
        add_profile(uid, 'attendee', None, guest_profiles.get(uid), au)

sql.append("insert into public.profiles (id, role, full_name, username, avatar_url, city, country, ui_theme, created_at) values\n  " + ",\n  ".join(pr_rows) + ";")
sql.append("insert into public.profile_private (id, email, phone, date_of_birth, gender, id_type, id_number_enc, id_image_path, id_expiry, id_status, id_submitted_at, id_reject_reason) values\n  " + ",\n  ".join(pv_rows) + ";")
if op_rows:
    sql.append("insert into public.organizer_profiles (id, company_name, logo_url, cover_url) values\n  " + ",\n  ".join(op_rows) + ";")
    sql.append("insert into public.organizer_subscriptions (organizer_id, plan_id, status, trial_ends_at) values\n  " +
               ",\n  ".join(f"({q(o)}, 'trial', 'trial', now() + interval '14 days')" for o in organizer_ids) + ";")
if st_rows:
    sql.append("insert into public.attendee_stats (id, score, attended, no_shows, vip_events, streak, longest_streak) values\n  " + ",\n  ".join(st_rows) + ";")
    sql.append("update public.attendee_stats set tier = private.score_tier_for(score, attended, no_shows);")

# ---------------------------------------------------------------- events
STATUS = {'draft': 'draft', 'published': 'published', 'archived': 'archived', 'completed': 'completed', 'cancelled': 'cancelled'}
ev_rows, es_rows = [], []
for e in events:
    secret = bool(e.get('secret_venue') or e.get('venue_secret'))
    status = STATUS.get(e.get('status'), 'archived')
    invite_only = e.get('registration_mode') == 'invite_only'
    visibility = 'private' if (e.get('is_private') or invite_only) else 'public'
    mode = 'open' if e.get('registration_mode') == 'open' else 'approval'
    admin = e.get('admin_status') if e.get('admin_status') in ('live', 'flagged', 'suspended') else 'live'
    published_at = e['created_at'] if status in ('published', 'archived', 'completed') else None
    ends = e.get('date_end')
    if ends and ends < e['date_start']:
        ends = None  # legacy data had an end before the start
    ev_rows.append(
        f"({q(e['id'])}, {q(e['organizer_id'])}, {q(e.get('slug'))}, {q(e['title'])}, {q(e.get('description'))}, "
        f"{q(e.get('cover_image_url'))}, {q(e.get('category_id'))}, {arr(e.get('tags') or [], 'text')}, {q(e.get('city'))}, "
        f"{q(e.get('venue_name'))}, {q(None if secret else e.get('venue_address'))}, {q(secret)}, {ts(e['date_start'])}, "
        f"{ts(ends)}, {q(e.get('capacity'))}, {q(status)}, {q(visibility)}, {q(mode)}, "
        f"{q(bool(e.get('require_id_verification')))}, {q(e.get('male_ratio_max'))}, {q(e.get('female_ratio_max'))}, "
        f"{q(admin)}, {ts(published_at)}, {ts(e.get('created_at'))})"
    )
    es_rows.append(
        f"({q(e['id'])}, {q(e.get('venue_address') if secret else None)}, {ts(e.get('venue_reveal_at'))}, "
        f"{q(bool(e.get('require_reference_code')))}, {q(e.get('reference_code'))})"
    )
if ev_rows:
    sql.append("insert into public.events (id, organizer_id, slug, title, description, cover_image_url, category_id, tags, city, venue_name, venue_address, is_secret_venue, starts_at, ends_at, capacity, status, visibility, registration_mode, require_id_verified, male_ratio_max, female_ratio_max, admin_status, published_at, created_at) values\n  " + ",\n  ".join(ev_rows) + ";")
    sql.append("insert into public.event_secrets (event_id, venue_address, reveal_at, require_reference_code, reference_code) values\n  " + ",\n  ".join(es_rows) + ";")

tt_rows = []
for t in ticket_types:
    if t['event_id'] not in event_ids:
        continue
    tt_rows.append(
        f"({q(t['id'])}, {q(t['event_id'])}, {q(t['name'])}, {pkr(t.get('price'))}, "
        f"{q(pkr(t['original_price']) if t.get('original_price') is not None else None)}, {q(t.get('quantity'))}, "
        f"{q(bool(t.get('is_vip')))}, {ts(t.get('created_at'))})"
    )
if tt_rows:
    sql.append("insert into public.ticket_types (id, event_id, name, price_pkr, original_price_pkr, quantity, is_vip, created_at) values\n  " + ",\n  ".join(tt_rows) + ";")

# ---------------------------------------------------------------- payment accounts
METHOD = {'bank': 'bank', 'jazzcash': 'jazzcash', 'easypaisa': 'easypaisa'}
pa_rows = []
for a in pay_accounts:
    pa_rows.append(
        f"({q(a['id'])}, {q(a['organizer_id'])}, {q(METHOD.get(a.get('account_type'), 'other'))}, {q(a.get('label'))}, "
        f"{q(a.get('account_title') or '')}, {q(a.get('account_number') or '')}, {q(a.get('bank_name'))}, {q(a.get('iban'))}, "
        f"{q(a.get('instructions'))}, {q(a.get('is_active', True))}, {ts(a.get('created_at'))})"
    )
if pa_rows:
    sql.append("insert into public.payment_accounts (id, organizer_id, method, label, account_title, account_number, bank_name, iban, instructions, is_active, created_at) values\n  " + ",\n  ".join(pa_rows) + ";")
pa_ids = {a['id'] for a in pay_accounts}
epa_rows = [f"({q(x['event_id'])}, {q(x['payment_account_id'])})" for x in event_pay
            if x['event_id'] in event_ids and x['payment_account_id'] in pa_ids]
if epa_rows:
    sql.append("insert into public.event_payment_accounts (event_id, payment_account_id) values\n  " + ",\n  ".join(epa_rows) + ";")

# ---------------------------------------------------------------- registrations (merge)
def days(v):
    return arr([d for d in v if d], 'date') if v else 'null'

regs = {}      # key -> dict
guest_to_reg = {}

for r in pub_regs:
    if r['event_id'] not in event_ids:
        continue
    email = (r.get('email') or '').lower().strip()
    key = (r['event_id'], email or r['id'])
    st = r.get('status')
    pay = r.get('payment_status')
    has_shot = bool(r.get('payment_screenshot_url'))
    if st == 'rejected':
        status = 'rejected'
    elif st == 'approved':
        if pay in ('confirmed', 'not_required'):
            status = 'confirmed'
        else:
            status = 'payment_submitted' if has_shot else 'awaiting_payment'
    else:
        status = 'requested'
    regs[key] = dict(id=r['id'], event_id=r['event_id'], email=email or None, name=r.get('full_name') or 'Guest',
                     phone=r.get('phone'), gender=r.get('gender'), source='self', status=status, notes=r.get('notes'),
                     days=r.get('ticket_days'), ref_code=r.get('reference_code_entered'), created=r.get('created_at'),
                     approved_at=r.get('reviewed_at') if status == 'confirmed' else None, ticket_type=None, is_vip=False,
                     plus_one=False, plus_one_name=None, checked_in=None, price_due=0, discount=0, paid=None,
                     shot=r.get('payment_screenshot_url'), pay=pay, qr=None, guest_ids=[])

for g in guests:
    if g['event_id'] not in event_ids:
        continue
    email = (g.get('email') or '').lower().strip()
    key = (g['event_id'], email or g['id'])
    gs = g.get('status')
    tt = tt_by_id.get(g.get('ticket_type_id'))
    due = pkr(tt['price']) if tt else 0
    if g.get('waitlist'):
        status = 'waitlisted'
    elif gs == 'checked_in':
        status = 'checked_in'
    else:
        status = 'confirmed'
    entry = regs.get(key)
    if entry is None:
        entry = dict(id=str(uuid.uuid4()), event_id=g['event_id'], email=email or None, name=g.get('full_name') or 'Guest',
                     phone=g.get('phone'), gender=g.get('gender'), source='invited' if gs == 'invited' else 'manual',
                     status=status, notes=None, days=g.get('ticket_days'), ref_code=None, created=g.get('created_at'),
                     approved_at=g.get('created_at'), ticket_type=None, is_vip=False, plus_one=False, plus_one_name=None,
                     checked_in=None, price_due=due, discount=0, paid=None, shot=None, pay=None, qr=None, guest_ids=[])
        regs[key] = entry
    elif gs == 'checked_in':
        entry['status'] = 'checked_in'
    entry['ticket_type'] = g.get('ticket_type_id') if tt else entry['ticket_type']
    entry['is_vip'] = bool(g.get('is_vip')) or entry['is_vip']
    entry['plus_one'] = bool(g.get('plus_one'))
    entry['plus_one_name'] = g.get('plus_one_name')
    entry['checked_in'] = g.get('checked_in_at') or entry['checked_in']
    entry['qr'] = g.get('qr_token')
    entry['discount'] = pkr(g.get('discount_amount'))
    if tt:
        entry['price_due'] = max(due - entry['discount'], 0)
    if g.get('ticket_price_paid') is not None:
        entry['paid'] = pkr(g['ticket_price_paid'])
    entry['guest_ids'].append(g['id'])
    guest_to_reg[g['id']] = entry['id']

reg_rows, sub_rows = [], []
used_attendee_event = set()
for entry in regs.values():
    att = attendee_ids_by_email.get(entry['email']) if entry['email'] else None
    if att and (entry['event_id'], att) in used_attendee_event and entry['status'] not in ('rejected', 'cancelled'):
        att = None  # avoid violating the one-active-registration rule
    if att and entry['status'] not in ('rejected', 'cancelled'):
        used_attendee_event.add((entry['event_id'], att))
    paid = entry['paid']
    if entry['status'] in ('confirmed', 'checked_in') and paid is None:
        paid = entry['price_due']
    approved = entry['approved_at'] if entry['status'] in ('confirmed', 'checked_in') else None
    qr_part = q(entry['qr']) if entry['qr'] else 'private.new_token()'
    reg_rows.append(
        f"({q(entry['id'])}, {q(entry['event_id'])}, {q(att)}, {q(entry['ticket_type'])}, {q(entry['source'])}, {q(entry['status'])}, "
        f"{q(entry['name'])}, {q(entry['phone'])}, {q(entry['email'])}, {enum_or_null(entry['gender'], ('male', 'female', 'other'))}, "
        f"{days(entry['days'])}, {q(entry['plus_one'])}, {q(entry['plus_one_name'])}, {q(entry['is_vip'])}, {q(entry['notes'])}, "
        f"{entry['price_due']}, {entry['discount']}, {q(paid)}, {q(entry['ref_code'])}, {qr_part}, {ts(approved)}, "
        f"{ts(entry['checked_in'])}, {ts(entry['created'])})"
    )
    if entry['shot']:
        legacy_path = re.sub(r'^.*?/payment-screenshots/', '', entry['shot'].split('?')[0])
        new_path = f"{att or ZERO}/{entry['id']}/{Path(legacy_path).name}"
        storage_map.append({'from_bucket': 'payment-screenshots', 'from_path': legacy_path, 'to_bucket': 'payment-proofs', 'to_path': new_path})
        sub_status = 'approved' if entry['pay'] == 'confirmed' else ('rejected' if entry['status'] == 'rejected' else 'submitted')
        sub_rows.append(f"({q(str(uuid.uuid4()))}, {q(entry['id'])}, {q(new_path)}, {entry['price_due']}, {q(sub_status)}, {ts(entry['created'])})")

if reg_rows:
    sql.append("insert into public.registrations (id, event_id, attendee_id, ticket_type_id, source, status, full_name, phone, email, gender, ticket_days, plus_one, plus_one_name, is_vip, notes, price_due_pkr, discount_pkr, price_paid_pkr, reference_code_entered, qr_token, approved_at, checked_in_at, created_at) values\n  " + ",\n  ".join(reg_rows) + ";")
if sub_rows:
    sql.append("insert into public.payment_submissions (id, registration_id, screenshot_path, amount_pkr, status, created_at) values\n  " + ",\n  ".join(sub_rows) + ";")

profile_ids = set(auth_users)
sl_rows = []
for s in scan_logs:
    reg = guest_to_reg.get(s.get('guest_id'))
    if not reg or s['event_id'] not in event_ids:
        continue
    by = s.get('scanned_by') if s.get('scanned_by') in profile_ids else None
    sl_rows.append(f"({q(s['event_id'])}, {q(reg)}, {q(by)}, 'admitted', {q(bool(s.get('is_offline_sync')))}, {ts(s.get('scanned_at'))})")
if sl_rows:
    sql.append("insert into public.scan_logs (event_id, registration_id, scanned_by, result, offline_synced, scanned_at) values\n  " + ",\n  ".join(sl_rows) + ";")

# ---------------------------------------------------------------- CRM
vendor_ids = set()
v_rows = []
for v in vendors:
    vendor_ids.add(v['id'])
    eids = [x for x in (v.get('event_ids') or []) if x in event_ids]
    v_rows.append(f"({q(v['id'])}, {q(v['organizer_id'])}, {q(v['name'])}, {q(v.get('category'))}, {q(v.get('contact_name'))}, {q(v.get('contact_email'))}, {q(v.get('contact_phone'))}, {q(v.get('notes'))}, {arr(eids, 'uuid')}, {ts(v.get('created_at'))})")
if v_rows:
    sql.append("insert into public.organizer_vendors (id, organizer_id, name, category, contact_name, contact_email, contact_phone, notes, event_ids, created_at) values\n  " + ",\n  ".join(v_rows) + ";")
vendor_owner = {v['id']: v['organizer_id'] for v in vendors}
i_rows = []
for i in invoices:
    if i['vendor_id'] not in vendor_ids:
        continue
    st = 'paid' if i.get('status') == 'paid' else 'pending'
    eid = i.get('event_id') if i.get('event_id') in event_ids else None
    i_rows.append(f"({q(i['id'])}, {q(vendor_owner[i['vendor_id']])}, {q(i['vendor_id'])}, {q(eid)}, {q(i.get('invoice_number'))}, {pkr(i.get('amount'))}, {q(i.get('due_date'))}, {q(st)}, {q(i.get('description'))}, {q(i.get('document_url'))}, {ts(i.get('paid_at'))}, {ts(i.get('created_at'))})")
if i_rows:
    sql.append("insert into public.organizer_vendor_invoices (id, organizer_id, vendor_id, event_id, invoice_number, amount_pkr, due_date, status, description, document_path, paid_at, created_at) values\n  " + ",\n  ".join(i_rows) + ";")

sql.append("select private.recompute_profile_complete(id) from public.profiles;")
sql.append('commit;')

(OUT / 'import.sql').write_text("\n\n".join(sql) + "\n")
(OUT / 'storage_map.json').write_text(json.dumps(storage_map, indent=1))
print(json.dumps({
    'profiles': len(pr_rows), 'organizers': len(organizer_ids), 'attendees': len(st_rows), 'events': len(ev_rows),
    'ticket_types': len(tt_rows), 'payment_accounts': len(pa_rows), 'registrations': len(reg_rows),
    'payment_submissions': len(sub_rows), 'scan_logs': len(sl_rows), 'vendors': len(v_rows), 'invoices': len(i_rows),
    'storage_files_to_copy': len(storage_map),
}, indent=1))
