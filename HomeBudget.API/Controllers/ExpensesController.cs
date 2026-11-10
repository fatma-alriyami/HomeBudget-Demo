using HomeBudget.API.Data;
using HomeBudget.API.DTOs;
using HomeBudget.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeBudget.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExpensesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExpensesController(AppDbContext context)
        {
            _context = context;
        }

        private IQueryable<ExpenseResponseDto> ExpenseResponses()
        {
            return _context.Expenses
                .AsNoTracking()
                .Select(expense => new ExpenseResponseDto
                {
                    Id = expense.Id,
                    FamilyMemberId = expense.FamilyMemberId,
                    FamilyMemberName = expense.FamilyMember.FullName,
                    ExpenseCategoryId = expense.ExpenseCategoryId,
                    ExpenseCategoryName = expense.ExpenseCategory.Name,
                    Amount = expense.Amount,
                    ExpenseDate = expense.ExpenseDate,
                    Notes = expense.Notes,
                    CreatedAt = expense.CreatedAt
                });
        }

        [HttpGet]
        public async Task<ActionResult<List<ExpenseResponseDto>>> GetAll()
        {
            var expenses = await ExpenseResponses()
                .OrderByDescending(expense => expense.ExpenseDate)
                .ThenByDescending(expense => expense.Id)
                .ToListAsync();

            return Ok(expenses);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ExpenseResponseDto>> GetById(int id)
        {
            var expense = await ExpenseResponses()
                .FirstOrDefaultAsync(expense => expense.Id == id);

            if (expense == null)
            {
                return NotFound(new { message = "Expense record not found." });
            }

            return Ok(expense);
        }

        [HttpPost]
        public async Task<ActionResult<ExpenseResponseDto>> Create(
            ExpenseCreateDto dto)
        {
            var validationError = await ValidateExpense(dto);

            if (validationError != null)
            {
                return BadRequest(new { message = validationError });
            }

            var expense = new Expense();
            ApplyChanges(expense, dto);

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            var response = await ExpenseResponses()
                .SingleAsync(record => record.Id == expense.Id);

            return CreatedAtAction(
                nameof(GetById),
                new { id = expense.Id },
                response);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ExpenseResponseDto>> Update(
            int id,
            ExpenseCreateDto dto)
        {
            var expense = await _context.Expenses.FindAsync(id);

            if (expense == null)
            {
                return NotFound(new { message = "Expense record not found." });
            }

            var validationError = await ValidateExpense(dto, expense);

            if (validationError != null)
            {
                return BadRequest(new { message = validationError });
            }

            ApplyChanges(expense, dto);
            await _context.SaveChangesAsync();

            var response = await ExpenseResponses()
                .SingleAsync(record => record.Id == id);

            return Ok(response);
        }

        private async Task<string?> ValidateExpense(
            ExpenseCreateDto dto,
            Expense? existing = null)
        {
            if (decimal.Round(dto.Amount, 3) != dto.Amount)
            {
                return "Amount must have no more than 3 decimal places.";
            }

            var expenseDate = dto.ExpenseDate?.Date;

            if (!expenseDate.HasValue ||
                expenseDate.Value < new DateTime(2000, 1, 1) ||
                expenseDate.Value > new DateTime(2100, 12, 31))
            {
                return "Expense date must be between 2000 and 2100.";
            }

            if (existing == null || existing.FamilyMemberId != dto.FamilyMemberId)
            {
                var memberIsActive = await _context.FamilyMembers
                    .AnyAsync(member =>
                        member.Id == dto.FamilyMemberId && member.IsActive);

                if (!memberIsActive)
                {
                    return "Please select an existing, active family member.";
                }
            }

            if (existing == null ||
                existing.ExpenseCategoryId != dto.ExpenseCategoryId)
            {
                var categoryIsActive = await _context.ExpenseCategories
                    .AnyAsync(category =>
                        category.Id == dto.ExpenseCategoryId && category.IsActive);

                if (!categoryIsActive)
                {
                    return "Please select an existing, active expense category.";
                }
            }

            return null;
        }

        private static void ApplyChanges(Expense expense, ExpenseCreateDto dto)
        {
            expense.FamilyMemberId = dto.FamilyMemberId;
            expense.ExpenseCategoryId = dto.ExpenseCategoryId;
            expense.Amount = dto.Amount;
            expense.ExpenseDate = dto.ExpenseDate!.Value.Date;
            expense.Notes = dto.Notes?.Trim();
        }
    }
}