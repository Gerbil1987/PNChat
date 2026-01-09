# Phone Number Missing from SOS Messages - FIX

## Problem Summary
The phone number was not appearing at the end of medical/incident messages sent to the SOS group, despite being present in the code string construction.

**Example of the issue:**
- Code: `Contact ${phone}` would result in: `Contact [phone_number]`
- Actual output: `Contact` (phone number missing)

## Root Cause
The `Phone` property was not being returned by the backend login API, so `this.currentUser?.Phone` was `undefined`.

**Why it happened:**
1. The backend `AccessToken` DTO (Data Transfer Object) was missing the `Phone` field
2. The `AuthService.Login()` method was not including the phone number when creating the `AccessToken`
3. Frontend code tried to access `this.currentUser?.Phone`, but it was never populated from the login response

## Solution Implemented

### 1. Updated `AccessToken.cs` DTO
**File:** `c:\Users\Administrator\Desktop\Code\PNChat\PNChatServer\PNChatServer\Dto\AccessToken.cs`

Added the `Phone` property to the AccessToken class:
```csharp
public class AccessToken
{
    public string User { get; set; }
    public string FullName { get; set; }
    public string Avatar { get; set; }
    public string Phone { get; set; }  // ← NEW PROPERTY
    public string Token { get; set; }
}
```

### 2. Updated `AuthService.cs` Login Method
**File:** `c:\Users\Administrator\Desktop\Code\PNChat\PNChatServer\PNChatServer\Service\AuthService.cs`

Modified the Login method to include the phone number in the returned AccessToken:
```csharp
return new AccessToken
{
    User = userExist.Code,
    FullName = userExist.FullName,
    Avatar = userExist.Avatar,
    Phone = userExist.Phone,  // ← NEW PROPERTY ASSIGNMENT
    Token = jwtTokenHandler.WriteToken(token),
};
```

## How It Works Now

1. **User logs in** → Backend `AuthService.Login()` is called
2. **Phone is included** → `AccessToken` now contains the user's phone number
3. **Data sent to frontend** → Client receives phone number in login response
4. **Frontend stores it** → `this.currentUser.Phone` is populated from the API response
5. **SOS messages work** → When sending medical/incident messages, the phone number is now available and included in the message

## Frontend Code (Already Working)
The frontend code in `message-detail.component.ts` was correct all along:
```typescript
const phone = this.currentUser?.Phone || '';
const message = `🚨 Medical emergency (${name})\nLocation: https://maps.google.com/?q=${lat},${lng}\nContact ${phone}`;
```

Now that the backend provides the phone number, this code will work as intended.

## Testing Steps

1. **Restart the backend server** to apply the changes
2. **Log in again** to get a new token with the phone number included
3. **Send a medical/incident alert** in the SOS group
4. **Verify** that the contact phone number now appears at the end of the message

## Expected Result
Messages will now display as:
- ✅ `🚨 Medical emergency (test27)\nLocation: https://maps.google.com/?q=26.263552,27.8888448\nContact [USER_PHONE]`
- ✅ `⚠️ Incident (test27)\nLocation: https://maps.google.com/?q=26.263552,27.8888448\nContact [USER_PHONE]`

Instead of:
- ❌ `🚨 Medical emergency (test27)\nLocation: https://maps.google.com/?q=26.263552,27.8888448\nContact`
- ❌ `⚠️ Incident (test27)\nLocation: https://maps.google.com/?q=26.263552,27.8888448\nContact`

## Files Modified
1. `PNChatServer/Dto/AccessToken.cs` - Added `Phone` property
2. `PNChatServer/Service/AuthService.cs` - Updated Login method to include phone

## No Frontend Changes Required
The frontend code was already correct; no changes needed in the Angular application.
